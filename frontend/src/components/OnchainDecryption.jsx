import React, { useState, useEffect } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount } from 'wagmi'
import { useOnchainDecryption } from '../hooks/useContracts'
import { useI18n } from '../contexts/I18nContext'

const OnchainDecryption = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { t } = useI18n()

  // State management
  const [inputNumber, setInputNumber] = useState('')
  const [isEncrypting, setIsEncrypting] = useState(false)

  // Use OnchainDecryption contract hook
  const {
    contractAddress: CONTRACT_ADDRESS,
    storeEncryptedNumber,
    requestDecryptNumber,
    resetDecryptionState,
    decryptionStatus,
    isGettingStatus,
    getStatusError,
    isWriting
  } = useOnchainDecryption()

  // Poll decryption status
  useEffect(() => {
    let interval
    if (decryptionStatus && decryptionStatus[0] === true) { // pending = true
      interval = setInterval(() => {
        // Status auto-updates since useReadContract keeps polling
      }, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [decryptionStatus])

  // Encrypt and store number
  const handleEncryptAndStore = async () => {
    if (!instance || !address || !inputNumber) {
      alert(t('onchain.decrypt_prereq'))
      return
    }

    setIsEncrypting(true)
    try {
      // Create encrypted input
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address)
      input.add32(parseInt(inputNumber))
      const encryptedInput = await input.encrypt()

      // Call contract to store (external ciphertext + proof)
      await storeEncryptedNumber(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      )

      alert(t('onchain.store_success'))
    } catch (error) {
      console.error('Encrypt store failed:', error)
      alert(t('onchain.store_failed') + ' ' + error.message)
    } finally {
      setIsEncrypting(false)
    }
  }

  // Request onchain decryption
  const handleRequestDecryption = async () => {
    if (!address) {
      alert(t('common.connect_wallet'))
      return
    }

    try {
      // Call contract request function
      await requestDecryptNumber()
      alert(t('onchain.request_submitted'))
    } catch (error) {
      console.error('Request decrypt failed:', error)
      alert(t('onchain.request_failed') + ' ' + error.message)
    }
  }

  // Reset decryption state
  const handleReset = async () => {
    try {
      await resetDecryptionState()
      alert(t('onchain.reset_done'))
    } catch (error) {
      console.error('Reset failed:', error)
      alert(t('onchain.reset_failed') + ' ' + error.message)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('onchain.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('common.sdk_required_for_crypto')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('onchain.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('onchain.goal_1')}</li>
          <li>{t('onchain.goal_2')}</li>
          <li>{t('onchain.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('onchain.contract_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Store external ciphertext -> internal encrypted value
function storeEncryptedNumber(externalEuint32 inputNumber, bytes calldata inputProof) external {
    euint32 encryptedNumber = FHE.fromExternal(inputNumber, inputProof);

    userEncryptedNumbers[msg.sender] = encryptedNumber;

    FHE.allowThis(userEncryptedNumbers[msg.sender]);
    FHE.allow(userEncryptedNumbers[msg.sender], msg.sender);

    emit NumberStored(msg.sender);
}

// Request asynchronous decryption
function requestDecryptNumber() external returns (uint256) {
    require(FHE.isInitialized(userEncryptedNumbers[msg.sender]), "No encrypted number stored");
    require(!isDecryptionPending[msg.sender], "Decryption already pending");

    // Prepare ciphertexts to decrypt
    bytes32[] memory cts = new bytes32[](1);
    cts[0] = FHE.toBytes32(userEncryptedNumbers[msg.sender]);

    // Request async decryption
    uint256 requestId = FHE.requestDecryption(
        cts,
        this.callbackDecryptNumber.selector
    );

    // Update state
    isDecryptionPending[msg.sender] = true;
    latestRequestIds[msg.sender] = requestId;
    requestIds[requestId] = msg.sender;

    emit DecryptionRequested(msg.sender, requestId);
    return requestId;
}

// Decryption callback
function callbackDecryptNumber(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) public returns (bool) {
    // Verify request ID
    address user = requestIds[requestId];
    require(user != address(0), "Invalid request ID");

    // Verify decryption proof
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);

    // Decode decrypted result
    uint32 decryptedValue = abi.decode(cleartexts, (uint32));

    // Store decrypted result
    decryptedNumbers[user] = decryptedValue;
    isDecryptionPending[user] = false;

    emit DecryptionCompleted(user, decryptedValue);
    return true;
}`}</pre>
          </div>

          <h5>📝 {t('onchain.frontend_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// 1) Store encrypted number
const input = instance.createEncryptedInput(contractAddress, userAddress)
input.add32(number)
const encryptedInput = await input.encrypt()
await contract.storeEncryptedNumber(
  encryptedInput.handles[0],
  encryptedInput.inputProof
)

// 2) Request onchain decryption
const tx = await contract.requestDecryptNumber()
await tx.wait()

// 3) Watch decryption status
const decryptionStatus = await contract.getDecryptionStatus(userAddress)
// decryptionStatus: [pending, requestId, decryptedNumber]

// 4) Await completion
// Decryption is done asynchronously by KMS via callback`}</pre>
          </div>
        </div>
      </div>

      {/* 步骤1: 输入和存储数字 */}
      <div style={{ marginBottom: '20px' }}>
        <h4>{t('onchain.step1_title')}</h4>
        <input
          type="number"
          value={inputNumber}
          onChange={(e) => setInputNumber(e.target.value)}
          placeholder={t('onchain.input_placeholder')}
          style={{
            padding: '8px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '200px'
          }}
        />

        <button
          onClick={handleEncryptAndStore}
          disabled={isEncrypting || isWriting || !inputNumber}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px',
            opacity: (!inputNumber || isEncrypting || isWriting) ? 0.6 : 1
          }}
        >
          {isEncrypting || isWriting ? t('onchain.storing') : t('onchain.encrypt_and_store')}
        </button>
      </div>

      {/* 步骤2: 请求解密 */}
      <div style={{ marginBottom: '20px' }}>
        <h4>{t('onchain.step2_title')}</h4>
        <button
          onClick={handleRequestDecryption}
          disabled={isWriting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            opacity: isWriting ? 0.6 : 1
          }}
        >
          {isWriting ? t('onchain.requesting') : t('onchain.request_decrypt')}
        </button>

        <button
          onClick={handleReset}
          disabled={isWriting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: isWriting ? 0.6 : 1
          }}
        >
          {t('onchain.reset_state')}
        </button>
      </div>

      {/* 解密状态显示 */}
      <div style={{ marginBottom: '20px' }}>
        <h4>{t('onchain.step3_title')}</h4>

        {isGettingStatus && (
          <div style={{ padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px', marginBottom: '10px' }}>
            ⏳ {t('onchain.getting_status')}
          </div>
        )}

        {getStatusError && (
          <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '10px' }}>
            ❌ {t('onchain.get_status_failed')}
          </div>
        )}

        {decryptionStatus && (
          <div style={{
            padding: '15px',
            backgroundColor: decryptionStatus[0] ? '#fff3cd' : '#e8f5e8',
            borderRadius: '4px',
            border: decryptionStatus[0] ? '1px solid #ffeaa7' : '1px solid #c3e6cb'
          }}>
            <h5>{t('onchain.status_title')}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
              <span><strong>{t('onchain.status')}:</strong></span>
              <span style={{ color: decryptionStatus[0] ? '#856404' : '#155724' }}>
                {decryptionStatus[0] ? '⏳ ' + t('onchain.status_pending') : '✅ ' + t('onchain.status_done')}
              </span>

              <span><strong>{t('onchain.request_id')}:</strong></span>
              <code style={{ fontSize: '12px' }}>
                {decryptionStatus[1] ? decryptionStatus[1].toString() : t('onchain.none')}
              </code>

              <span><strong>{t('onchain.decrypted_result')}:</strong></span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
                {decryptionStatus[2] ? decryptionStatus[2].toString() : t('onchain.waiting')}
              </span>
            </div>

            {decryptionStatus[0] && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffeaa7', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  ⚡ {t('onchain.pending_hint_line1')} {t('onchain.pending_hint_line2')}
                </p>
              </div>
            )}

            {!decryptionStatus[0] && decryptionStatus[2] && decryptionStatus[2] !== '0' && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#c3e6cb', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  🎉 {t('onchain.done_hint_prefix')} <strong>{inputNumber}</strong> {t('onchain.done_hint_middle')} <strong>{decryptionStatus[2].toString()}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {!decryptionStatus && !isGettingStatus && (
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ margin: 0, color: '#666' }}>
              💡 {t('onchain.tip_store_then_request')}
            </p>
          </div>
        )}
      </div>

      {/* 教学说明 */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('onchain.features_title')}</h5>
        <ul>
          <li><strong>{t('onchain.async')}:</strong> {t('onchain.async_desc')}</li>
          <li><strong>{t('onchain.security')}:</strong> {t('onchain.security_desc')}</li>
          <li><strong>{t('onchain.state')}:</strong> {t('onchain.state_desc')}</li>
          <li><strong>{t('onchain.events')}:</strong> {t('onchain.events_desc')}</li>
        </ul>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <h5>💡 {t('onchain.use_cases')}</h5>
          <ul>
            <li>{t('onchain.case_1')}</li>
            <li>{t('onchain.case_2')}</li>
            <li>{t('onchain.case_3')}</li>
            <li>{t('onchain.case_4')}</li>
          </ul>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h5>⚠️ {t('onchain.caveats')}</h5>
          <ul>
            <li>{t('onchain.irreversible')}</li>
            <li>{t('onchain.gas')}</li>
            <li>{t('onchain.congestion')}</li>
            <li>{t('onchain.right_timing')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OnchainDecryption
