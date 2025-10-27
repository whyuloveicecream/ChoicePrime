import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useNumberStorage } from '../hooks/useContracts'
import { useAccount } from 'wagmi'
import { useI18n } from '../contexts/I18nContext'

const NumberStorage = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address } = useAccount()
  const { t } = useI18n()
  const {
    contractAddress,
    storeNumber,
    isStoring,
    storeData,
    storedNumber,
    isGettingStored,
    getStoredError
  } = useNumberStorage()

  const [number, setNumber] = useState('')
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [encryptedData, setEncryptedData] = useState(null)

  const handleEncryptNumber = async () => {
    if (!instance || !number || !address) {
      alert(t('number_storage.ensure_wallet_and_input'))
      return
    }

    setIsEncrypting(true)
    try {
      // Create encrypted input
      const input = instance.createEncryptedInput(contractAddress, address)
      input.add32(parseInt(number))

      const encryptedInput = await input.encrypt()

      setEncryptedData({
        handle: encryptedInput.handles[0],
        inputProof: encryptedInput.inputProof
      })

      console.log('Encrypt success:', encryptedInput)
    } catch (error) {
      console.error('Encrypt failed:', error)
      alert(t('number_storage.encrypt_failed') + ' ' + error.message)
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleStoreNumber = async () => {
    if (!encryptedData) {
      alert(t('number_storage.need_encrypt_first'))
      return
    }

    try {
      // Call contract to store encrypted number
      await storeNumber({
        args: [encryptedData.handle, encryptedData.inputProof]
      })
      alert(t('number_storage.store_success'))
    } catch (error) {
      console.error('Store failed:', error)
      alert(t('number_storage.store_failed') + ' ' + error.message)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('number_storage.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('common.sdk_required_for_crypto')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('number_storage.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('number_storage.goal_1')}</li>
          <li>{t('number_storage.goal_2')}</li>
          <li>{t('number_storage.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('common.contract_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// NumberStorage.sol
contract NumberStorage is SepoliaConfig {
    mapping(address => euint32) private userNumbers;

    event NumberStored(address indexed user);

    function storeNumber(
        externalEuint32 inputNumber,
        bytes calldata inputProof
    ) external {
        // Verify and convert external encrypted input
        euint32 encryptedNumber = FHE.fromExternal(inputNumber, inputProof);

        // Store in user mapping
        userNumbers[msg.sender] = encryptedNumber;

        // Set access control permissions
        FHE.allowThis(userNumbers[msg.sender]);
        FHE.allow(userNumbers[msg.sender], msg.sender);

        emit NumberStored(msg.sender);
    }

    function getStoredNumber() external view returns (euint32) {
        return userNumbers[msg.sender];
    }
}`}</pre>
          </div>

          <h5>📝 {t('common.frontend_encrypt_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Frontend encryption and storage
const encryptAndStore = async () => {
  // 1. Create encrypted input
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  input.add32(parseInt(numberValue))  // Add a 32-bit number

  // 2. Perform encryption
  const encryptedInput = await input.encrypt()

  // 3. Call contract to store
  await contract.storeNumber(
    encryptedInput.handles[0],    // Encrypted data handle
    encryptedInput.inputProof     // Input proof
  )
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('number_storage.input_title')}</h4>
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={t('number_storage.input_placeholder')}
          style={{
            width: '200px',
            padding: '8px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleEncryptNumber}
          disabled={!instance || !number || isEncrypting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {isEncrypting ? t('number_storage.encrypting') : t('number_storage.encrypt_button')}
        </button>

        {encryptedData && (
          <button
            onClick={handleStoreNumber}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('number_storage.store_button')}
          </button>
        )}
      </div>

      {encryptedData && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>✅ {t('number_storage.encrypt_success')}</h4>
          <p><strong>{t('number_storage.original_number')}:</strong> {number}</p>
          <p><strong>{t('number_storage.cipher_handle')}:</strong></p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {encryptedData.handle}
          </code>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            📝 {t('number_storage.handle_note')}
          </p>
        </div>
      )}

      {storeData && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <h4>✅ {t('number_storage.store_success')}</h4>
          <p><strong>{t('common.tx_hash')}:</strong> {storeData.hash}</p>
          <p><strong>{t('common.contract_address')}:</strong> {contractAddress}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {t('number_storage.store_success_desc')}
          </p>
        </div>
      )}

      {storedNumber && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          {/* <h4>📖 {t('number_storage.stored_title')}</h4>
          <p><strong>{t('number_storage.cipher_handle')}:</strong></p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {storedNumber}
          </code>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            {t('number_storage.stored_handle_desc')}
          </p> */}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('common.tech_notes')}</h5>
        <ul>
          <li><strong>euint32:</strong> {t('number_storage.euint32_desc')}</li>
          <li><strong>{t('number_storage.cipher_handle')}:</strong> {t('number_storage.handle_desc')}</li>
          <li><strong>{t('number_storage.input_proof')}:</strong> {t('number_storage.input_proof_desc')}</li>
        </ul>
      </div>
    </div>
  )
}

export default NumberStorage
