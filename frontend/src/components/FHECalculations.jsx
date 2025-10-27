import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount, useWalletClient } from 'wagmi'
import { getContractAddress } from '../config/contracts'
import { useI18n } from '../contexts/I18nContext'
import { Contract } from 'ethers'
import { useEthersSigner } from '../hooks/useEthersSigner'
import NumberStorageABI from '../config/NumberStorageABI'
import { useNumberStorage } from '../hooks/useContracts'

const FHECalculations = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { t } = useI18n()
  const signer = useEthersSigner({ chainId })
  const [operationNumber, setOperationNumber] = useState('')
  const [divisor, setDivisor] = useState('')
  const [selectedOperation, setSelectedOperation] = useState('add')
  const [isProcessing, setIsProcessing] = useState(false)
  const [calculationResult, setCalculationResult] = useState(null)
  const [currentStoredNumber, setCurrentStoredNumber] = useState(null)

  // Contract address
  const CONTRACT_ADDRESS = getContractAddress('NumberStorage', chainId)

  const operations = [
    { value: 'add', label: t('fhe_calc.op.add.label'), description: t('fhe_calc.op.add.desc') },
    { value: 'subtract', label: t('fhe_calc.op.subtract.label'), description: t('fhe_calc.op.subtract.desc') },
    { value: 'multiply', label: t('fhe_calc.op.multiply.label'), description: t('fhe_calc.op.multiply.desc') },
    { value: 'divide', label: t('fhe_calc.op.divide.label'), description: t('fhe_calc.op.divide.desc') }
  ]

  // NumberStorage helpers
  const {
    addToStoredNumber,
    subtractFromStoredNumber,
    multiplyStoredNumber,
    divideStoredNumber,
    storedNumber,
  } = useNumberStorage()

  const handleGetStoredNumber = async () => {
    try {
      if (!storedNumber) throw new Error('No stored number')
      setCurrentStoredNumber(storedNumber.toString())
      console.log('Fetched stored number handle')
    } catch (error) {
      console.error('Fetch failed:', error)
      alert(t('fhe_calc.fetch_failed') + ' ' + error.message)
    }
  }

  const handleCalculation = async () => {
    if (!instance || !address) {
      alert(t('common.connect_wallet'))
      return
    }

    if (selectedOperation === 'divide') {
      if (!divisor || parseInt(divisor) <= 0) {
        alert(t('fhe_calc.invalid_divisor'))
        return
      }
    } else {
      if (!operationNumber) {
        alert(t('fhe_calc.enter_operand'))
        return
      }
    }

    setIsProcessing(true)
    try {
      let encryptedData = null

      if (selectedOperation !== 'divide') {
        // Create encrypted input (division doesn't require encrypted input)
        const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address)
        input.add32(parseInt(operationNumber))
        const encryptedInput = await input.encrypt()

        encryptedData = {
          handle: encryptedInput.handles[0],
          inputProof: encryptedInput.inputProof
        }
      }

      // Execute on-chain calculation
      let tx
      if (selectedOperation === 'add') {
        tx = await addToStoredNumber({ args: [encryptedData.handle, encryptedData.inputProof] })
      } else if (selectedOperation === 'subtract') {
        tx = await subtractFromStoredNumber({ args: [encryptedData.handle, encryptedData.inputProof] })
      } else if (selectedOperation === 'multiply') {
        tx = await multiplyStoredNumber({ args: [encryptedData.handle, encryptedData.inputProof] })
      } else if (selectedOperation === 'divide') {
        tx = await divideStoredNumber({ args: [parseInt(divisor)] })
      }

      // Fetch calculation result handle from contract
      const signerPromise = await signer
      const contract = new Contract(CONTRACT_ADDRESS, NumberStorageABI, signerPromise)
      const resultHandle = await contract.getCalculationResult(address)

      setCalculationResult({
        operation: selectedOperation,
        operand: selectedOperation === 'divide' ? divisor : operationNumber,
        txHash: tx?.hash || '',
        resultHandle: resultHandle.toString()
      })

    } catch (error) {
      console.error('Calculation failed:', error)
      alert(t('fhe_calc.calc_failed') + ' ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecryptResult = async () => {
    if (!calculationResult || !walletClient) {
      alert(t('fhe_calc.no_result_or_wallet'))
      return
    }

    try {
      const handle = calculationResult.resultHandle
      const keypair = instance.generateKeypair()

      const handleContractPairs = [
        { handle, contractAddress: CONTRACT_ADDRESS }
      ]

      const startTimeStamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = '10'
      const contractAddresses = [CONTRACT_ADDRESS]

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      )

      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message
      })

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      )

      const decrypted = result[handle]
      const decryptedStr = (decrypted !== null && decrypted !== undefined)
        ? (typeof decrypted === 'string' ? decrypted : (decrypted.toString ? decrypted.toString() : String(decrypted)))
        : ''
      setCalculationResult(prev => ({ ...prev, decryptedResult: decryptedStr }))

    } catch (error) {
      console.error('Decrypt failed:', error)
      alert(t('fhe_calc.decrypt_failed') + ' ' + error.message)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('fhe_calc.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('fhe_calc.sdk_required_for_calc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('fhe_calc.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('fhe_calc.goal_1')}</li>
          <li>{t('fhe_calc.goal_2')}</li>
          <li>{t('fhe_calc.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('fhe_calc.contract_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// NumberStorage.sol - FHE operations

// Addition: ciphertext + ciphertext
function addToStoredNumber(externalEuint32 inputNumber, bytes calldata inputProof) external {
    require(FHE.isInitialized(userNumbers[msg.sender]), "No stored number");

    euint32 numberToAdd = FHE.fromExternal(inputNumber, inputProof);
    euint32 result = FHE.add(userNumbers[msg.sender], numberToAdd);

    calculationResults[msg.sender] = result;
    FHE.allowThis(calculationResults[msg.sender]);
    FHE.allow(calculationResults[msg.sender], msg.sender);

    emit CalculationPerformed(msg.sender, "addition");
}

// Subtraction: ciphertext - ciphertext
function subtractFromStoredNumber(externalEuint32 inputNumber, bytes calldata inputProof) external {
    require(FHE.isInitialized(userNumbers[msg.sender]), "No stored number");

    euint32 numberToSubtract = FHE.fromExternal(inputNumber, inputProof);
    euint32 result = FHE.sub(userNumbers[msg.sender], numberToSubtract);

    calculationResults[msg.sender] = result;
    FHE.allowThis(calculationResults[msg.sender]);
    FHE.allow(calculationResults[msg.sender], msg.sender);

    emit CalculationPerformed(msg.sender, "subtraction");
}

// Multiplication: ciphertext × ciphertext
function multiplyStoredNumber(externalEuint32 inputNumber, bytes calldata inputProof) external {
    require(FHE.isInitialized(userNumbers[msg.sender]), "No stored number");

    euint32 numberToMultiply = FHE.fromExternal(inputNumber, inputProof);
    euint32 result = FHE.mul(userNumbers[msg.sender], numberToMultiply);

    calculationResults[msg.sender] = result;
    FHE.allowThis(calculationResults[msg.sender]);
    FHE.allow(calculationResults[msg.sender], msg.sender);

    emit CalculationPerformed(msg.sender, "multiplication");
}

// Division: ciphertext ÷ plaintext (divisor must be plaintext)
function divideStoredNumber(uint32 divisor) external {
    require(FHE.isInitialized(userNumbers[msg.sender]), "No stored number");
    require(divisor > 0, "Divisor must be greater than 0");

    euint32 result = FHE.div(userNumbers[msg.sender], divisor);

    calculationResults[msg.sender] = result;
    FHE.allowThis(calculationResults[msg.sender]);
    FHE.allow(calculationResults[msg.sender], msg.sender);

    emit CalculationPerformed(msg.sender, "division");
}

// Add two users' numbers (multi-user demo)
function addTwoStoredNumbers(address userA, address userB) external {
    require(FHE.isInitialized(userNumbers[userA]), "UserA has no stored number");
    require(FHE.isInitialized(userNumbers[userB]), "UserB has no stored number");

    euint32 result = FHE.add(userNumbers[userA], userNumbers[userB]);

    calculationResults[msg.sender] = result;
    FHE.allowThis(calculationResults[msg.sender]);
    FHE.allow(calculationResults[msg.sender], msg.sender);

    emit CalculationPerformed(msg.sender, "add_two_users");
}`}</pre>
          </div>

          <h5>📝 {t('fhe_calc.frontend_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Frontend implementation for FHE calculations

// Encrypt operand (except division)
const performFHECalculation = async (operation, operand) => {
  let encryptedData = null;

  if (operation !== 'divide') {
    // Create encrypted input
    const input = instance.createEncryptedInput(contractAddress, userAddress)
    input.add32(parseInt(operand))
    const encryptedInput = await input.encrypt()

    encryptedData = {
      handle: encryptedInput.handles[0],
      inputProof: encryptedInput.inputProof
    }
  }

  // Call corresponding contract function
  switch (operation) {
    case 'add':
      await contract.addToStoredNumber(
        encryptedData.handle,
        encryptedData.inputProof
      )
      break

    case 'subtract':
      await contract.subtractFromStoredNumber(
        encryptedData.handle,
        encryptedData.inputProof
      )
      break

    case 'multiply':
      await contract.multiplyStoredNumber(
        encryptedData.handle,
        encryptedData.inputProof
      )
      break

    case 'divide':
      // Division: plaintext divisor, no encryption required
      await contract.divideStoredNumber(parseInt(operand))
      break
  }
}

// Get calculation result for current user
const getCalculationResult = async () => {
  return await contract.getCalculationResult(userAddress)
}

// Supported FHE operation types
const fheOperations = {
  arithmetic: ['add', 'sub', 'mul', 'div', 'rem'],  // arithmetic
  comparison: ['eq', 'ne', 'lt', 'le', 'gt', 'ge'], // comparison
  bitwise: ['and', 'or', 'xor', 'not'],             // bitwise
  special: ['min', 'max', 'select']                 // special
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('fhe_calc.step1_title')}</h4>
        <button
          onClick={handleGetStoredNumber}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {t('fhe_calc.get_stored_number')}
        </button>
        {currentStoredNumber && (
          <span style={{ color: 'green' }}>
            ✅ {t('fhe_calc.current_stored')}: {currentStoredNumber}
          </span>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('fhe_calc.step2_title')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          {operations.map((op) => (
            <label
              key={op.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                border: selectedOperation === op.value ? '2px solid #2196F3' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: selectedOperation === op.value ? '#f0f8ff' : 'white'
              }}
            >
              <input
                type="radio"
                value={op.value}
                checked={selectedOperation === op.value}
                onChange={(e) => setSelectedOperation(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>{op.label}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{op.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('fhe_calc.step3_title')}</h4>
        {selectedOperation === 'divide' ? (
          <div>
            <input
              type="number"
              value={divisor}
              onChange={(e) => setDivisor(e.target.value)}
              placeholder={t('fhe_calc.input_divisor_placeholder')}
              style={{
                width: '300px',
                padding: '8px',
                margin: '10px 0',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <p style={{ fontSize: '14px', color: '#666' }}>
              📝 {t('fhe_calc.divide_note')}
            </p>
          </div>
        ) : (
          <div>
            <input
              type="number"
              value={operationNumber}
              onChange={(e) => setOperationNumber(e.target.value)}
              placeholder={t('fhe_calc.input_operand_placeholder')}
              style={{
                width: '300px',
                padding: '8px',
                margin: '10px 0',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <p style={{ fontSize: '14px', color: '#666' }}>
              {t('fhe_calc.encrypt_operand_note')}
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleCalculation}
          disabled={!instance || isProcessing || !currentStoredNumber}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isProcessing ? t('fhe_calc.processing') : `${t('fhe_calc.execute')} ${operations.find(op => op.value === selectedOperation)?.label}`}
        </button>
      </div>

      {calculationResult && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>✅ {t('fhe_calc.calc_done')}</h4>
          <p><strong>{t('fhe_calc.op_type')}:</strong> {operations.find(op => op.value === calculationResult.operation)?.label}</p>
          <p><strong>{t('fhe_calc.operand')}:</strong> {calculationResult.operand}</p>
          <p><strong>{t('common.tx_hash')}:</strong> {calculationResult.txHash}</p>
          <p><strong>{t('fhe_calc.result_handle')}:</strong></p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {calculationResult.resultHandle}
          </code>

          <div style={{ marginTop: '15px' }}>
            <button
              onClick={handleDecryptResult}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t('fhe_calc.decrypt_to_view')}
            </button>
          </div>

          {calculationResult.decryptedResult !== undefined && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
              <h5>🎉 {t('fhe_calc.decrypted_result')}:</h5>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }}>
                {calculationResult.decryptedResult}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('fhe_calc.features_title')}</h5>
        <ul>
          <li><strong>{t('fhe_calc.homomorphic')}:</strong> {t('fhe_calc.homomorphic_desc')}</li>
          <li><strong>{t('fhe_calc.privacy')}:</strong> {t('fhe_calc.privacy_desc')}</li>
          <li><strong>{t('fhe_calc.result_encrypted')}:</strong> {t('fhe_calc.result_encrypted_desc')}</li>
          <li><strong>{t('fhe_calc.acl')}:</strong> {t('fhe_calc.acl_desc')}</li>
        </ul>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h5>⚡ {t('fhe_calc.limits_title')}:</h5>
          <ul>
            <li><strong>{t('fhe_calc.divide')}:</strong> {t('fhe_calc.divide_desc')}</li>
            <li><strong>{t('fhe_calc.mod')}:</strong> {t('fhe_calc.mod_desc')}</li>
            <li><strong>{t('fhe_calc.gas')}:</strong> {t('fhe_calc.gas_desc')}</li>
            <li><strong>{t('fhe_calc.precision')}:</strong> {t('fhe_calc.precision_desc')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FHECalculations
