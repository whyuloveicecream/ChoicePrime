import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { getContractAddress } from '../config/contracts'
import { useI18n } from '../contexts/I18nContext'
import { useAddressStorage } from '../hooks/useContracts'

const AddressStorage = () => {
  const { instance, isInitialized } = useFHEVM()
  const { address, chainId } = useAccount()
  const { t } = useI18n()
  const [inputAddress, setInputAddress] = useState('')
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [encryptedData, setEncryptedData] = useState(null)
  const [txHash, setTxHash] = useState('')
  const [useRandomAddress, setUseRandomAddress] = useState(false)

  // Contract address
  const CONTRACT_ADDRESS = getContractAddress('AddressStorage', chainId)

  // Contract write helpers
  const {
    storeAddress: writeStoreAddress,
    storeRandomAddress: writeStoreRandomAddress,
  } = useAddressStorage()

  const generateRandomAddress = () => {
    // Generate a random Ethereum address
    const randomBytes = new Uint8Array(20)
    crypto.getRandomValues(randomBytes)
    const randomAddress = '0x' + Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
    setInputAddress(randomAddress)
  }

  const handleEncryptAddress = async () => {
    if (!instance || !address) {
      alert(t('common.connect_wallet'))
      return
    }

    if (!useRandomAddress && (!inputAddress || !isAddress(inputAddress))) {
      alert(t('address_storage.invalid_eth_address'))
      return
    }

    setIsEncrypting(true)
    try {
      // Create encrypted input
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address)

      if (useRandomAddress) {
        // For random address, it will be generated in contract
        // Just mark random address mode here
        setEncryptedData({
          isRandomAddress: true,
          handle: null,
          inputProof: null
        })
      } else {
        // Encrypt user input address
        input.addAddress(inputAddress)
        const encryptedInput = await input.encrypt()

        setEncryptedData({
          isRandomAddress: false,
          handle: encryptedInput.handles[0],
          inputProof: encryptedInput.inputProof,
          originalAddress: inputAddress
        })
      }

      console.log('Address encryption prepared')
    } catch (error) {
      console.error('Encrypt failed:', error)
      alert(t('address_storage.encrypt_failed') + ' ' + error.message)
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleStoreAddress = async () => {
    if (!encryptedData) {
      alert(t('address_storage.need_prepare_first'))
      return
    }

    try {
      // Call contract to store the encrypted address
      if (encryptedData.isRandomAddress) {
        const tx = await writeStoreRandomAddress()
        setTxHash(tx?.hash || '')
      } else {
        const tx = await writeStoreAddress({
          args: [encryptedData.handle, encryptedData.inputProof]
        })
        setTxHash(tx?.hash || '')
      }
    } catch (error) {
      console.error('Store failed:', error)
      alert(t('address_storage.store_failed') + ' ' + error.message)
    }
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0', opacity: 0.6 }}>
        <h3>{t('address_storage.section_title')}</h3>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>⏳ {t('common.init_sdk_first')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{t('common.sdk_required_for_crypto')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('address_storage.section_title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('common.learning_objectives')}</h4>
        <ul>
          <li>{t('address_storage.goal_1')}</li>
          <li>{t('address_storage.goal_2')}</li>
          <li>{t('address_storage.goal_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('common.contract_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// AddressStorage.sol
contract AddressStorage is SepoliaConfig {
    mapping(address => eaddress) private userAddresses;

    event AddressStored(address indexed user);

    // Store user-provided encrypted address
    function storeAddress(
        externalEaddress inputAddress,
        bytes calldata inputProof
    ) external {
        eaddress encryptedAddress = FHE.fromExternal(inputAddress, inputProof);

        userAddresses[msg.sender] = encryptedAddress;

        FHE.allowThis(userAddresses[msg.sender]);
        FHE.allow(userAddresses[msg.sender], msg.sender);

        emit AddressStored(msg.sender);
    }

    // Generate and store a random address
    function storeRandomAddress() external {
        // Generate a random address
        address randomAddr = address(uint160(uint256(
            keccak256(abi.encodePacked(
                block.timestamp,
                msg.sender,
                block.difficulty
            ))
        )));
        eaddress randomAddress = FHE.asEaddress(randomAddr);

        userAddresses[msg.sender] = randomAddress;

        FHE.allowThis(userAddresses[msg.sender]);
        FHE.allow(userAddresses[msg.sender], msg.sender);

        emit AddressStored(msg.sender);
    }

    function getStoredAddress() external view returns (eaddress) {
        return userAddresses[msg.sender];
    }
}`}</pre>
          </div>

          <h5>📝 {t('address_storage.frontend_encrypt_code')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// Two ways to handle encrypted addresses

// Method 1: Encrypt a user-provided address
const encryptUserAddress = async (address) => {
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  input.addAddress(address)  // Add address type data

  const encryptedInput = await input.encrypt()

  // Call contract to store
  await contract.storeAddress(
    encryptedInput.handles[0],
    encryptedInput.inputProof
  )
}

// Method 2: Use contract to generate a random address
const storeRandomAddress = async () => {
  // Directly call the contract; no frontend encryption needed
  await contract.storeRandomAddress()
}`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('address_storage.select_input_method')}</h4>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="radio"
              checked={!useRandomAddress}
              onChange={() => setUseRandomAddress(false)}
              style={{ marginRight: '8px' }}
            />
            {t('address_storage.manual_input')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="radio"
              checked={useRandomAddress}
              onChange={() => setUseRandomAddress(true)}
              style={{ marginRight: '8px' }}
            />
            {t('address_storage.use_random')}
          </label>
        </div>
      </div>

      {!useRandomAddress ? (
        <div style={{ marginBottom: '20px' }}>
          <h4>{t('address_storage.input_title')}</h4>
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder={t('address_storage.input_placeholder')}
            style={{
              width: '100%',
              padding: '8px',
              margin: '10px 0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={generateRandomAddress}
            style={{
              padding: '5px 10px',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {t('address_storage.generate_example')}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>{t('address_storage.random_mode_title')}</h4>
          <p>{t('address_storage.random_mode_desc')}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleEncryptAddress}
          disabled={!instance || isEncrypting}
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
          {isEncrypting ? t('address_storage.preparing') : t('address_storage.prepare_encrypt')}
        </button>

        {encryptedData && (
          <button
            onClick={handleStoreAddress}
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

      {encryptedData && !encryptedData.isRandomAddress && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>✅ {t('address_storage.encrypt_success')}</h4>
          <p><strong>{t('address_storage.original_address')}:</strong></p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {encryptedData.originalAddress}
          </code>
          <p><strong>{t('number_storage.cipher_handle')}:</strong></p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {encryptedData.handle}
          </code>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            📝 {t('address_storage.eaddress_note')}
          </p>
        </div>
      )}

      {encryptedData && encryptedData.isRandomAddress && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4>✅ {t('address_storage.random_ready')}</h4>
          <p>{t('address_storage.random_ready_desc')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            🎲 {t('address_storage.random_tip')}
          </p>
        </div>
      )}

      {txHash && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <h4>✅ {t('number_storage.store_success')}</h4>
          <p><strong>{t('common.tx_hash')}:</strong> {txHash}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {t('address_storage.store_success_desc')}
          </p>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('common.tech_notes')}</h5>
        <ul>
          <li><strong>eaddress:</strong> {t('address_storage.eaddress_desc')}</li>
          <li><strong>{t('address_storage.address_validation')}:</strong> {t('address_storage.address_validation_desc')}</li>
          <li><strong>{t('address_storage.random_gen')}:</strong> {t('address_storage.random_gen_desc')}</li>
          <li><strong>{t('address_storage.privacy')}:</strong> {t('address_storage.privacy_desc')}</li>
        </ul>
      </div>
    </div>
  )
}

export default AddressStorage
