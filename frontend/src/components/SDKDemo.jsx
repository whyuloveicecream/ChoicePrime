import { useState } from 'react'
import { useFHEVM } from '../hooks/useFHEVM'
import { useAccount } from 'wagmi'
import { useI18n } from '../contexts/I18nContext'

const SDKDemo = () => {
  const { instance, isLoading, error, isInitialized, initFHEVM } = useFHEVM()
  const [installationComplete, setInstallationComplete] = useState(false)
  const { address } = useAccount()
  const { t } = useI18n()

  const handleInstallSDK = () => {
    // Simulate installation process
    setInstallationComplete(true)
  }

  const handleInitSDK = async () => {
    if (!address) {
      alert(t('sdk.connect_wallet'))
      return
    }
    console.log('Starting SDK initialization...')
    const success = await initFHEVM()
    console.log('Initialization complete, result:', success)
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>{t('sdk.title')}</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('sdk.what_is')}</h4>
        <p>{t('sdk.what_is_desc')}</p>
        <ul>
          <li>{t('sdk.feature_1')}</li>
          <li>{t('sdk.feature_2')}</li>
          <li>{t('sdk.feature_3')}</li>
        </ul>

        <div style={{ marginTop: '15px' }}>
          <h5>📝 {t('sdk.code_example')}</h5>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
            <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// 1. Import SDK
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk'

// 2. Create FHEVM instance
const instance = await createInstance({
  ...SepoliaConfig,
  network: window.ethereum
})

// 3. Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress)
input.add32(42)  // Encrypt a 32-bit number
const encryptedInput = await input.encrypt()

// 4. Call contract method
await contract.storeNumber(
  encryptedInput.handles[0],
  encryptedInput.inputProof
)`}</pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>{t('sdk.step1')}</h4>
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <code>npm install @zama-fhe/relayer-sdk</code>
        </div>

        {!installationComplete ? (
          <button
            onClick={handleInstallSDK}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('sdk.install_btn')}
          </button>
        ) : (
          <div style={{ color: 'green', marginBottom: '20px' }}>
            ✅ {t('sdk.install_success')}
          </div>
        )}
      </div>

      {installationComplete && (
        <div style={{ marginBottom: '20px' }}>
          <h4>{t('sdk.step2')}</h4>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            {t('sdk.init_desc')}
          </p>

          {!address && (
            <div style={{ color: '#ff9800', marginBottom: '10px' }}>
              ⚠️ {t('sdk.connect_wallet')}
            </div>
          )}

          {!isInitialized ? (
            <button
              onClick={handleInitSDK}
              disabled={!address || isLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: address ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: address ? 'pointer' : 'not-allowed'
              }}
            >
              {isLoading ? t('sdk.initializing') : t('sdk.init_btn')}
            </button>
          ) : (
            <div style={{ color: 'green' }}>
              ✅ {t('sdk.init_success')}
            </div>
          )}

          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              ❌ {t('sdk.init_failed')} {error}
            </div>
          )}

          {/* SDK initialization code example */}
          <div style={{ marginTop: '12px' }}>
            <h5>📝 SDK initialization code:</h5>
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
              <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{`// 1) Initialize SDK
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle'

await initSDK()

// 2) Create FHEVM instance
const config = {
  ...SepoliaConfig,
  network: window.ethereum
}
const instance = await createInstance(config)

// 3) (Optional) Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress)
input.add32(42)
const encryptedInput = await input.encrypt()`}</pre>
            </div>
          </div>
        </div>
      )}

      {instance && isInitialized && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <h4>🎉 {t('sdk.instance_created')}</h4>
          <p>{t('sdk.instance_desc')}</p>
          <div style={{ marginTop: '10px' }}>
            <h5>{t('sdk.config_title')}</h5>
            <ul style={{ fontSize: '12px' }}>
              <li>{t('sdk.config_network')}</li>
              <li>{t('sdk.config_chain')}</li>
              <li>{t('sdk.config_gateway')}</li>
              <li>{t('sdk.config_relayer')}</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h5>{t('sdk.next_learn')}</h5>
        <ol>
          <li>{t('sdk.next_1')}</li>
          <li>{t('sdk.next_2')}</li>
          <li>{t('sdk.next_3')}</li>
          <li>{t('sdk.next_4')}</li>
          <li>{t('sdk.next_5')}</li>
        </ol>

        {!isInitialized && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            <strong>📝 {t('sdk.note')}</strong> {t('sdk.note_desc')}
          </div>
        )}
      </div>
    </div>
  )
}

export default SDKDemo
