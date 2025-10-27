import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount, useWalletClient } from 'wagmi'
import { useNumberStorage } from '../hooks/useContracts'
import { Contract } from 'ethers'
import { useEthersSigner } from '../hooks/useEthersSigner'
import NumberStorageABI from '../config/NumberStorageABI'
import { useI18n } from '../contexts/I18nContext'

const NumberComparison = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const signer = useEthersSigner({ chainId })
  const { t } = useI18n()
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonValue, setComparisonValue] = useState('')
  const [comparisonType, setComparisonType] = useState('equal')
  const [comparisonResult, setComparisonResult] = useState(null)
  const [isDecryptingResult, setIsDecryptingResult] = useState(false)
  const [userAAddress, setUserAAddress] = useState('')
  const [userBAddress, setUserBAddress] = useState('')
  const [isComparingTwoUsers, setIsComparingTwoUsers] = useState(false)

  // Use NumberStorage contract hook
  const {
    contractAddress: CONTRACT_ADDRESS,
    writeContract,
    storedNumber,
    isGettingStored,
    getStoredError
  } = useNumberStorage()

  // Helper to detect empty euint32 (0x00..)
  const isZeroBytes32 = (v) => {
    if (!v) return true
    const s = v.toString()
    return /^0x0{64}$/i.test(s)
  }
  const hasStoredNumber = storedNumber && !isZeroBytes32(storedNumber)

  const comparisonTypes = [
    { value: 'equal', label: t('cmp.equal.label'), description: t('cmp.equal.desc') },
    { value: 'greater', label: t('cmp.greater.label'), description: t('cmp.greater.desc') },
    { value: 'less', label: t('cmp.less.label'), description: t('cmp.less.desc') },
    { value: 'greater_or_equal', label: t('cmp.greater_or_equal.label'), description: t('cmp.greater_or_equal.desc') },
    { value: 'less_or_equal', label: t('cmp.less_or_equal.label'), description: t('cmp.less_or_equal.desc') }
  ]

  const handleSingleComparison = async () => {
    if (!instance || !comparisonValue || !address || !walletClient) {
      alert(t('cmp.ensure_wallet_and_value'))
      return
    }

    if (!hasStoredNumber) {
      alert(t('cmp.no_stored_number'))
      return
    }

    setIsComparing(true)
    try {
      // Create encrypted input
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address)
      input.add32(parseInt(comparisonValue))
      const encryptedInput = await input.encrypt()

      // Call different contract methods based on comparison type
      let functionName
      switch (comparisonType) {
        case 'equal':
          functionName = 'compareStoredNumberEqual'
          break
        case 'greater':
          functionName = 'compareStoredNumberGreater'
          break
        case 'less':
          functionName = 'compareStoredNumberLess'
          break
        case 'greater_or_equal':
          functionName = 'compareStoredNumberGreaterOrEqual'
          break
        case 'less_or_equal':
          functionName = 'compareStoredNumberLessOrEqual'
          break
        default:
          throw new Error('Invalid comparison type')
      }

      // Call contract method
      const result = await writeContract({
        functionName,
        args: [encryptedInput.handles[0], encryptedInput.inputProof]
      })

      console.log('Comparison tx sent:', result)
      alert(t('cmp.compare_success'))

    } catch (error) {
      console.error('Compare failed:', error)
      alert(t('cmp.compare_failed') + ' ' + error.message)
    } finally {
      setIsComparing(false)
    }
  }

  const handleTwoUsersComparison = async () => {
    if (!userAAddress || !userBAddress || !address || !walletClient) {
      alert(t('cmp.enter_two_addresses'))
      return
    }

    setIsComparingTwoUsers(true)
    try {
      // 调用合约方法比较两个用户的数字
      const result = await writeContract({
        functionName: 'compareTwoUsersNumbers',
        args: [userAAddress, userBAddress, comparisonType]
      })

      console.log('Users comparison tx sent:', result)
      alert(t('cmp.users_compare_success'))

    } catch (error) {
      console.error('Users compare failed:', error)
      alert(t('cmp.users_compare_failed') + ' ' + error.message)
    } finally {
      setIsComparingTwoUsers(false)
    }
  }

  const handleDecryptComparisonResult = async () => {
    if (!instance || !address || !walletClient) {
      alert(t('common.connect_wallet'))
      return
    }

    setIsDecryptingResult(true)
    try {
      // First fetch comparison result from contract
      const signerPromise = await signer
      const contract = new Contract(CONTRACT_ADDRESS, NumberStorageABI, signerPromise)
      const comparisonResultHandle = await contract.getComparisonResult(address)

      if (!comparisonResultHandle) {
        alert(t('cmp.no_result_found'))
        return
      }

      // Generate keypair
      const keypair = instance.generateKeypair()

      // Prepare user decryption request
      const handleContractPairs = [
        {
          handle: comparisonResultHandle.toString(),
          contractAddress: CONTRACT_ADDRESS,
        },
      ]

      const startTimeStamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = "10"
      const contractAddresses = [CONTRACT_ADDRESS]

      // Create EIP712 typed data
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      )

      // User signature
      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message
      })

      // Execute user decryption
      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      )

      const decryptedResult = result[comparisonResultHandle.toString()]
      setComparisonResult(decryptedResult)

      console.log('Decrypted comparison result:', decryptedResult)
    } catch (error) {
      console.error('Decrypt comparison result failed:', error)
      alert(t('cmp.decrypt_failed') + ' ' + error.message)
    } finally {
      setIsDecryptingResult(false)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('cmp.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('cmp.sdk_required_for_cmp')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('cmp.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('cmp.goal_1')}</li>
          <li>{t('cmp.goal_2')}</li>
          <li>{t('cmp.goal_3')}</li>
          <li>{t('cmp.goal_4')}</li>
        </ul>
         <p>Encrypted Comparison only return the compare result, not reveal the real number.</p>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('cmp.contract_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Encrypted number comparison example
function compareStoredNumberEqual(externalEuint32 inputNumber, bytes calldata inputProof) external {
    euint32 numberToCompare = FHE.fromExternal(inputNumber, inputProof);
    ebool result = FHE.eq(userNumbers[msg.sender], numberToCompare);  // equality

    comparisonResults[msg.sender] = result;
    FHE.allowThis(comparisonResults[msg.sender]);
    FHE.allow(comparisonResults[msg.sender], msg.sender);
}

// Other comparison operators
FHE.gt(a, b)  // greater than
FHE.lt(a, b)  // less than
FHE.ge(a, b)  // greater or equal
FHE.le(a, b)  // less or equal
FHE.ne(a, b)  // not equal`}</pre>
          </div>

          <h5>📝 {t('cmp.frontend_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Frontend encrypted comparison flow
const compareNumbers = async (compareValue, comparisonType) => {
  // 1) Create encrypted input
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  input.add32(parseInt(compareValue))
  const encryptedInput = await input.encrypt()

  // 2) Call contract compare method
  const result = await contract.compareStoredNumberEqual(
    encryptedInput.handles[0],
    encryptedInput.inputProof
  )

  // 3) Decrypt boolean result
  const comparisonResult = await userDecrypt(resultHandle)
  console.log('comparison result:', comparisonResult) // true/false
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>{t('cmp.plan1_title')}</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          {t('cmp.plan1_desc')}
        </p>

        {!hasStoredNumber && (
          <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '15px' }}>
            ⚠️ {t('cmp.no_number_tip')}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('cmp.select_type')}</label>
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '5px'
            }}
          >
            {comparisonTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{comparisonTypes.find(ti => ti.value === comparisonType)?.description}</p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('cmp.input_number_label')}</label>
          <input
            type="number"
            value={comparisonValue}
            onChange={(e) => setComparisonValue(e.target.value)}
            placeholder={t('cmp.input_number_placeholder')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={handleSingleComparison}
          disabled={!instance || !comparisonValue || !hasStoredNumber || isComparing}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (!instance || !comparisonValue || !storedNumber || isComparing) ? 0.6 : 1
          }}
        >
          {isComparing ? t('cmp.comparing') : t('cmp.execute_compare')}
        </button>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
        <h4>{t('cmp.plan2_title')}</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          {t('cmp.plan2_desc')}
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('cmp.user_a')}</label>
          <input
            type="text"
            value={userAAddress}
            onChange={(e) => setUserAAddress(e.target.value)}
            placeholder={t('cmp.user_a_placeholder')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('cmp.user_b')}</label>
          <input
            type="text"
            value={userBAddress}
            onChange={(e) => setUserBAddress(e.target.value)}
            placeholder={t('cmp.user_b_placeholder')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={() => setUserBAddress(address)}
            style={{
              marginTop: '5px',
              padding: '5px 10px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {t('cmp.use_my_address')}
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('cmp.select_type_simple')}</label>
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value="equal">{t('cmp.equal_simple')}</option>
            <option value="greater">{t('cmp.greater_simple')}</option>
            <option value="less">{t('cmp.less_simple')}</option>
          </select>
        </div>

        <button
          onClick={handleTwoUsersComparison}
          disabled={!instance || !userAAddress || !userBAddress || isComparingTwoUsers}
          style={{
            padding: '10px 20px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (!instance || !userAAddress || !userBAddress || isComparingTwoUsers) ? 0.6 : 1
          }}
        >
          {isComparingTwoUsers ? t('cmp.comparing') : t('cmp.compare_two_users')}
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h4>{t('cmp.view_result')}</h4>
        <p>Encrypted Comparison only return the compare result, not reveal the real number.</p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          {t('cmp.decrypt_tip')}
        </p>

        <button
          onClick={handleDecryptComparisonResult}
          disabled={!instance || isDecryptingResult}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (!instance || isDecryptingResult) ? 0.6 : 1
          }}
        >
          {isDecryptingResult ? t('cmp.decrypting') : t('cmp.decrypt_result')}
        </button>

        {comparisonResult !== null && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
            <h5>✅ {t('cmp.result_title')}</h5>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: comparisonResult ? '#4CAF50' : '#f44336' }}>
              {comparisonResult ? t('cmp.true') : t('cmp.false')}
            </p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {comparisonResult ? t('cmp.condition_true') : t('cmp.condition_false')}
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('cmp.features_title')}</h5>
        <ul>
          <li><strong>{t('cmp.privacy')}:</strong> {t('cmp.privacy_desc')}</li>
          <li><strong>{t('cmp.result_encrypted')}:</strong> {t('cmp.result_encrypted_desc')}</li>
          <li><strong>{t('cmp.zk')}:</strong> {t('cmp.zk_desc')}</li>
          <li><strong>{t('cmp.composability')}:</strong> {t('cmp.composability_desc')}</li>
        </ul>

        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <strong>💡 {t('cmp.use_cases')}:</strong>
          <br />
          • {t('cmp.case_1')}
          <br />
          • {t('cmp.case_2')}
          <br />
          • {t('cmp.case_3')}
          <br />
          • {t('cmp.case_4')}
        </div>
      </div>
    </div>
  )
}

export default NumberComparison
