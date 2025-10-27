import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount, useWalletClient } from 'wagmi'
import { useNumberStorage } from '../hooks/useContracts'
import { useI18n } from '../contexts/I18nContext'

const NumberDecryption = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { t } = useI18n()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedValue, setDecryptedValue] = useState(null)
  const [ciphertextHandle, setCiphertextHandle] = useState('')

  // Use NumberStorage contract hook
  const {
    contractAddress: CONTRACT_ADDRESS,
    storedNumber,
    isGettingStored,
    getStoredError
  } = useNumberStorage()

  const handleDecryptNumber = async () => {
    if (!instance || !ciphertextHandle || !address || !walletClient) {
      alert(t('number_decrypt.ensure_wallet_and_handle'))
      return
    }

    setIsDecrypting(true)
    try {
      // Generate keypair
      const keypair = instance.generateKeypair()

      // Prepare user decryption request
      const handleContractPairs = [
        {
          handle: ciphertextHandle,
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

      const decryptedValue = result[ciphertextHandle]
      setDecryptedValue(decryptedValue)

      console.log('Decrypt success:', decryptedValue)
    } catch (error) {
      console.error('Decrypt failed:', error)
      alert(t('number_decrypt.decrypt_failed') + ' ' + error.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleFetchFromContract = async () => {
    // Fetch user's encrypted number from contract
    try {
      if (!storedNumber) {
        alert(t('number_decrypt.no_number_warning'))
        return
      }

      // Convert storedNumber to string handle
      const handle = storedNumber.toString()
      setCiphertextHandle(handle)
      console.log('Fetched handle from contract:', handle)
    } catch (error) {
      console.error('Fetch failed:', error)
      alert(t('common.fetch_failed') + ' ' + error.message)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('number_decrypt.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('common.sdk_required_for_crypto')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('number_decrypt.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('number_decrypt.goal_1')}</li>
          <li>{t('number_decrypt.goal_2')}</li>
          <li>{t('number_decrypt.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('number_decrypt.contract_read_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Read encrypted data from contract
function getStoredNumber() external view returns (euint32) {
    return userNumbers[msg.sender];
}

// Get another user's encrypted data (requires permission)
function getStoredNumberByUser(address user) external view returns (euint32) {
    return userNumbers[user];
}`}</pre>
          </div>

          <h5>📝 {t('number_decrypt.frontend_decrypt_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// User decryption flow
const decryptData = async (ciphertextHandle) => {
  // 1. Generate a temporary keypair
  const keypair = instance.generateKeypair()

  // 2. Prepare decryption request
  const handleContractPairs = [{
    handle: ciphertextHandle,
    contractAddress: CONTRACT_ADDRESS
  }]

  // 3. Create EIP712 typed data
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    [CONTRACT_ADDRESS],
    timestamp,
    duration
  )

  // 4. User signature
  const signature = await walletClient.signTypedData({
    domain: eip712.domain,
    types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    primaryType: 'UserDecryptRequestVerification',
    message: eip712.message
  })

  // 5. Execute decryption
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    [CONTRACT_ADDRESS],
    userAddress,
    timestamp,
    duration
  )

  return result[ciphertextHandle]
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('number_decrypt.step1_title')}</h4>

        {isGettingStored && (
          <div style={{ padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px', marginBottom: '10px' }}>
            ⏳ {t('number_decrypt.fetching')}
          </div>
        )}

        {getStoredError && (
          <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '10px' }}>
            ❌ {t('number_decrypt.fetch_error')}
          </div>
        )}

        <button
          onClick={handleFetchFromContract}
          disabled={isGettingStored || !address}
          style={{
            padding: '10px 20px',
            backgroundColor: storedNumber ? '#4CAF50' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (!address || isGettingStored) ? 0.6 : 1
          }}
        >
          {storedNumber ? t('number_decrypt.fetch_button_done') : t('number_decrypt.fetch_button')}
        </button>

        {!storedNumber && !isGettingStored && !getStoredError && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            💡 {t('number_decrypt.tip_no_stored_number')}
          </p>
        )}
      </div>

      {ciphertextHandle && (
        <div style={{ marginBottom: '20px' }}>
          <h4>{t('number_decrypt.step2_title')}</h4>
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
            <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {ciphertextHandle}
            </code>
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {t('number_decrypt.handle_desc')}
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('number_decrypt.step3_title')}</h4>
        <input
          type="text"
          value={ciphertextHandle}
          onChange={(e) => setCiphertextHandle(e.target.value)}
          placeholder={t('number_decrypt.input_placeholder_handle')}
          style={{
            width: '100%',
            padding: '8px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />

        <button
          onClick={handleDecryptNumber}
          disabled={!instance || !ciphertextHandle || isDecrypting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isDecrypting ? t('number_decrypt.decrypting') : t('number_decrypt.decrypt_button')}
        </button>
      </div>

      {decryptedValue !== null && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <h4>✅ {t('number_decrypt.decrypt_success')}</h4>
          <p><strong>{t('number_decrypt.result_label')}:</strong> {decryptedValue.toString()}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            🎉 {t('number_decrypt.congrats_text')}
          </p>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('number_decrypt.process_notes')}</h5>
        <ol>
          <li><strong>{t('number_decrypt.kp')}:</strong> {t('number_decrypt.kp_desc')}</li>
          <li><strong>{t('number_decrypt.eip712')}:</strong> {t('number_decrypt.eip712_desc')}</li>
          <li><strong>{t('number_decrypt.user_sig')}:</strong> {t('number_decrypt.user_sig_desc')}</li>
          <li><strong>{t('number_decrypt.exec_decrypt')}:</strong> {t('number_decrypt.exec_decrypt_desc')}</li>
        </ol>

        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <strong>⚠️ {t('number_decrypt.security_note')}:</strong> {t('number_decrypt.security_note_desc')}
        </div>
      </div>
    </div>
  )
}

export default NumberDecryption
