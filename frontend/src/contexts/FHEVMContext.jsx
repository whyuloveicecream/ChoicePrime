import React, { createContext, useContext, useState, useEffect } from 'react'
import { createInstance, SepoliaConfig, initSDK } from '@zama-fhe/relayer-sdk/bundle'
import { useAccount } from 'wagmi'

const FHEVMContext = createContext()

export const FHEVMProvider = ({ children }) => {
  const [instance, setInstance] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { address } = useAccount()

  // Debug: log state changes
  useEffect(() => {
    console.log('FHEVMContext state change - isInitialized:', isInitialized, 'instance:', !!instance)
  }, [isInitialized, instance])

  const initFHEVM = async () => {
    console.log('initFHEVM called, address:', address, 'window.ethereum:', !!window.ethereum)

    if (!address || !window.ethereum) {
      const errorMsg = 'Please connect your wallet first'
      console.log('Initialization failed:', errorMsg)
      setError(errorMsg)
      return false
    }

    try {
      console.log('Starting initialization...')
      setIsLoading(true)
      setError(null)

      // Initialize SDK
      console.log('Calling initSDK()...')
      await initSDK()
      console.log('initSDK() completed')

      // Create FHEVM instance
      const config = {
        ...SepoliaConfig
      }
      console.log('Creating instance with config:', config)

      const fhevmInstance = await createInstance(config)
      console.log('Instance created:', !!fhevmInstance)

      setInstance(fhevmInstance)
      setIsInitialized(true)
      console.log('Context updated: instance set and isInitialized = true')
      return true
    } catch (err) {
      console.error('Failed to initialize FHEVM:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
      console.log('Loading state set to false')
    }
  }

  const resetFHEVM = () => {
    setInstance(null)
    setIsInitialized(false)
    setError(null)
  }

  const value = {
    instance,
    isLoading,
    error,
    isInitialized,
    initFHEVM,
    resetFHEVM
  }

  return (
    <FHEVMContext.Provider value={value}>
      {children}
    </FHEVMContext.Provider>
  )
}

export const useFHEVM = () => {
  const context = useContext(FHEVMContext)
  if (context === undefined) {
    throw new Error('useFHEVM must be used within a FHEVMProvider')
  }
  return context
}
