import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount, useWalletClient } from 'wagmi'
import { useAddressStorage } from '../hooks/useContracts'
import { useI18n } from '../contexts/I18nContext'

const AddressDecryption = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { t } = useI18n()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedAddress, setDecryptedAddress] = useState(null)
  const [ciphertextHandle, setCiphertextHandle] = useState('')

  // Use AddressStorage contract hook
  const {
    contractAddress: CONTRACT_ADDRESS,
    storedAddress,
    isGettingStored,
    getStoredError
  } = useAddressStorage()

  const handleDecryptAddress = async () => {
    if (!instance || !ciphertextHandle || !address || !walletClient) {
      alert(t('address_decrypt.ensure_wallet_and_handle'))
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
      setDecryptedAddress(decryptedValue)

      console.log('Address decrypted:', decryptedValue)
    } catch (error) {
      console.error('Decrypt failed:', error)
      alert(t('address_decrypt.decrypt_failed') + ' ' + error.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleFetchFromContract = async () => {
    // Fetch the user's encrypted address from contract
    try {
      if (!storedAddress) {
        alert(t('address_decrypt.no_address_warning'))
        return
      }

      // Convert storedAddress to string handle
      const handle = storedAddress.toString()
      setCiphertextHandle(handle)
      console.log('Fetched address handle from contract:', handle)
    } catch (error) {
      console.error('Fetch failed:', error)
      alert(t('common.fetch_failed') + ' ' + error.message)
    }
  }

  const isValidEthereumAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('address_decrypt.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('common.sdk_required_for_crypto')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('address_decrypt.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('address_decrypt.goal_1')}</li>
          <li>{t('address_decrypt.goal_2')}</li>
          <li>{t('address_decrypt.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('address_decrypt.contract_read_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Contract functions to get encrypted addresses
function getStoredAddress() external view returns (eaddress) {
    return userAddresses[msg.sender];
}

// Get another user's encrypted address (requires permission)
function getStoredAddressByUser(address user) external view returns (eaddress) {
    return userAddresses[user];
}

// Compare two encrypted addresses (return comparison result)
function compareAddresses(address userA, address userB)
    external view returns (eaddress) {
    require(FHE.isInitialized(userAddresses[userA]), "UserA no address");
    require(FHE.isInitialized(userAddresses[userB]), "UserB no address");

    // Here we can return a comparison result or one of the addresses
    return userAddresses[userA];
}`}</pre>
          </div>

          <h5>📝 {t('address_decrypt.frontend_decrypt_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Full address decryption flow
const decryptAddress = async (addressHandle) => {
  // 1. Generate a keypair for decryption
  const keypair = instance.generateKeypair()

  // 2. Prepare decryption request
  const handleContractPairs = [{
    handle: addressHandle,
    contractAddress: CONTRACT_ADDRESS
  }]

  // 3. Create timestamp and validity period
  const startTimeStamp = Math.floor(Date.now() / 1000).toString()
  const durationDays = "10"

  // 4. Create EIP712 typed data
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    [CONTRACT_ADDRESS],
    startTimeStamp,
    durationDays
  )

  // 5. User signature
  const signature = await walletClient.signTypedData({
    domain: eip712.domain,
    types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    primaryType: 'UserDecryptRequestVerification',
    message: eip712.message
  })

  // 6. Execute decryption
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    [CONTRACT_ADDRESS],
    userAddress,
    startTimeStamp,
    durationDays
  )

  // 7. Return decrypted address
  return result[addressHandle]
}

// Validate address format
const isValidAddress = (addr) => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('address_decrypt.step1_title')}</h4>

        {isGettingStored && (
          <div style={{ padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px', marginBottom: '10px' }}>
            ⏳ {t('address_decrypt.fetching')}
          </div>
        )}

        {getStoredError && (
          <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '10px' }}>
            ❌ {t('address_decrypt.fetch_error')}
          </div>
        )}

        <button
          onClick={handleFetchFromContract}
          disabled={isGettingStored || !address}
          style={{
            padding: '10px 20px',
            backgroundColor: storedAddress ? '#4CAF50' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (!address || isGettingStored) ? 0.6 : 1
          }}
        >
          {storedAddress ? t('address_decrypt.fetch_button_done') : t('address_decrypt.fetch_button')}
        </button>

        {!storedAddress && !isGettingStored && !getStoredError && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            💡 {t('address_decrypt.tip_no_stored_address')}
          </p>
        )}
      </div>

      {ciphertextHandle && (
        <div style={{ marginBottom: '20px' }}>
          <h4>{t('address_decrypt.step2_title')}</h4>
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
            <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {ciphertextHandle}
            </code>
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {t('address_decrypt.handle_desc')}
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('address_decrypt.step3_title')}</h4>
        <input
          type="text"
          value={ciphertextHandle}
          onChange={(e) => setCiphertextHandle(e.target.value)}
          placeholder={t('address_decrypt.input_placeholder_handle')}
          style={{
            width: '100%',
            padding: '8px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        />

        <button
          onClick={handleDecryptAddress}
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
          {isDecrypting ? t('address_decrypt.decrypting') : t('address_decrypt.decrypt_button')}
        </button>
      </div>

      {decryptedAddress !== null && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <h4>✅ {t('address_decrypt.decrypt_success')}</h4>
          <p><strong>{t('address_decrypt.result_label')}:</strong></p>
          <code style={{
            fontSize: '14px',
            wordBreak: 'break-all',
            backgroundColor: '#f5f5f5',
            padding: '5px',
            borderRadius: '3px',
            display: 'block',
            margin: '10px 0'
          }}>
            {decryptedAddress}
          </code>

          <div style={{ marginTop: '15px' }}>
            {isValidEthereumAddress(decryptedAddress) ? (
              <div style={{ color: 'green' }}>
                ✅ {t('address_decrypt.valid_eth')}
              </div>
            ) : (
              <div style={{ color: 'orange' }}>
                ⚠️ {t('address_decrypt.random_or_special')}
              </div>
            )}
          </div>

          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            🎉 {t('address_decrypt.congrats_text')}
          </p>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('address_decrypt.features_title')}</h5>
        <ul>
          <li><strong>eaddress:</strong> {t('address_storage.eaddress_desc')}</li>
          <li><strong>{t('address_decrypt.format_validation')}:</strong> {t('address_decrypt.format_validation_desc')}</li>
          <li><strong>{t('address_decrypt.random_address')}:</strong> {t('address_decrypt.random_address_desc')}</li>
          <li><strong>{t('address_storage.privacy')}:</strong> {t('address_storage.privacy_desc')}</li>
        </ul>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <h5>💡 {t('address_decrypt.use_cases')}</h5>
          <ul>
            <li>{t('address_decrypt.case_1')}</li>
            <li>{t('address_decrypt.case_2')}</li>
            <li>{t('address_decrypt.case_3')}</li>
            <li>{t('address_decrypt.case_4')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AddressDecryption
