import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import './App.css'

// Import components
import ZamaIntro from './components/ZamaIntro'
import SDKDemo from './components/SDKDemo'
import NumberStorage from './components/NumberStorage'
import NumberDecryption from './components/NumberDecryption'
import AddressStorage from './components/AddressStorage'
import AddressDecryption from './components/AddressDecryption'
import OnchainDecryption from './components/OnchainDecryption'
import FHECalculations from './components/FHECalculations'
import NumberComparison from './components/NumberComparison'
import ConfidentialToken from './components/ConfidentialToken'

// Import Context
import { FHEVMProvider } from './contexts/FHEVMContext'
import { I18nProvider, useI18n } from './contexts/I18nContext'

// Chapter configuration
const chapters = [
  {
    id: 'intro',
    titleKey: 'chapter.intro',
    icon: '🏠',
    fallbackIcon: '■',
    component: null
  },
  {
    id: 'zama-intro',
    titleKey: 'chapter.zama_intro',
    icon: '🔐',
    fallbackIcon: '♦',
    component: ZamaIntro
  },
  {
    id: 'sdk',
    titleKey: 'chapter.sdk',
    icon: '📦',
    fallbackIcon: '▲',
    component: SDKDemo
  },
  {
    id: 'number-storage',
    titleKey: 'chapter.number_storage',
    icon: '🔢',
    fallbackIcon: '●',
    component: NumberStorage
  },
  {
    id: 'number-decrypt',
    titleKey: 'chapter.number_decrypt',
    icon: '🔓',
    fallbackIcon: '◆',
    component: NumberDecryption
  },
  {
    id: 'address-storage',
    titleKey: 'chapter.address_storage',
    icon: '📧',
    fallbackIcon: '▼',
    component: AddressStorage
  },
  {
    id: 'address-decrypt',
    titleKey: 'chapter.address_decrypt',
    icon: '🔍',
    fallbackIcon: '◉',
    component: AddressDecryption
  },
  {
    id: 'onchain-decrypt',
    titleKey: 'chapter.onchain_decrypt',
    icon: '⚡',
    fallbackIcon: '⚡',
    component: OnchainDecryption
  },
  {
    id: 'calculations',
    titleKey: 'chapter.calculations',
    icon: '🧮',
    fallbackIcon: '★',
    component: FHECalculations
  },
  {
    id: 'number-comparison',
    titleKey: 'chapter.number_comparison',
    icon: '⚖️',
    fallbackIcon: '⚖',
    component: NumberComparison
  },
  {
    id: 'confidential-token',
    titleKey: 'chapter.confidential_token',
    icon: '💱',
    fallbackIcon: '$',
    component: ConfidentialToken
  },
  {
    id: 'conclusion',
    titleKey: 'chapter.conclusion',
    icon: '🎉',
    fallbackIcon: '✓',
    component: null
  }
]

function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  const buttonBaseStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.2)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    minWidth: '65px',
  }

  const activeStyle = {
    background: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }

  const inactiveStyle = {
    background: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
  }

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      padding: '4px',
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
    }}>
      <button
        onClick={() => setLang('en')}
        style={{
          ...buttonBaseStyle,
          ...(lang === 'en' ? activeStyle : inactiveStyle),
        }}
        onMouseEnter={(e) => {
          if (lang !== 'en') {
            e.target.style.background = 'rgba(255,255,255,0.18)'
            e.target.style.transform = 'scale(1.02)'
          }
        }}
        onMouseLeave={(e) => {
          if (lang !== 'en') {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.transform = 'scale(1)'
          }
        }}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => setLang('zh')}
        style={{
          ...buttonBaseStyle,
          ...(lang === 'zh' ? activeStyle : inactiveStyle),
        }}
        onMouseEnter={(e) => {
          if (lang !== 'zh') {
            e.target.style.background = 'rgba(255,255,255,0.18)'
            e.target.style.transform = 'scale(1.02)'
          }
        }}
        onMouseLeave={(e) => {
          if (lang !== 'zh') {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.transform = 'scale(1)'
          }
        }}
      >
        🇨🇳 中文
      </button>
      <button
        onClick={() => setLang('fr')}
        style={{
          ...buttonBaseStyle,
          ...(lang === 'fr' ? activeStyle : inactiveStyle),
        }}
        onMouseEnter={(e) => {
          if (lang !== 'fr') {
            e.target.style.background = 'rgba(255,255,255,0.18)'
            e.target.style.transform = 'scale(1.02)'
          }
        }}
        onMouseLeave={(e) => {
          if (lang !== 'fr') {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.transform = 'scale(1)'
          }
        }}
      >
        🇫🇷 FR
      </button>
    </div>
  )
}

function AppContent() {
  const { address, isConnected } = useAccount()
  const [currentChapter, setCurrentChapter] = useState('intro')
  const { t } = useI18n()

  // Render chapter icon
  const renderChapterIcon = (chapter, size = '20px') => {
    return (
      <span
        className="chapter-icon emoji-support"
        style={{
          fontSize: size,
          display: 'inline-block',
          minWidth: size,
          textAlign: 'center',
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif'
        }}
      >
        {chapter.icon}
      </span>
    )
  }

  // Render sidebar
  const renderSidebar = () => (
    <div style={{
      width: '280px',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      padding: '20px 0',
      position: 'fixed',
      top: '0',
      left: '0',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📚 {t('sidebar.title')}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {t('sidebar.subtitle')}
        </p>
      </div>

      <nav>
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            onClick={() => setCurrentChapter(chapter.id)}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              backgroundColor: currentChapter === chapter.id ? '#e3f2fd' : 'transparent',
              borderLeft: currentChapter === chapter.id ? '4px solid #2196F3' : '4px solid transparent',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#f0f0f0'
              }
            }}
            onMouseEnter={(e) => {
              if (currentChapter !== chapter.id) {
                e.target.style.backgroundColor = '#f0f0f0'
              }
            }}
            onMouseLeave={(e) => {
              if (currentChapter !== chapter.id) {
                e.target.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#999' }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              {renderChapterIcon(chapter, '20px')}
              <span style={{
                fontSize: '14px',
                fontWeight: currentChapter === chapter.id ? '600' : '400',
                color: currentChapter === chapter.id ? '#2196F3' : '#333'
              }}>
                {t(chapter.titleKey)}
              </span>
            </div>
          </div>
        ))}
      </nav>

      {/* Progress indicator */}
      <div style={{ padding: '20px', marginTop: '30px' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          {t('progress.title')}
        </div>
        <div style={{
          height: '6px',
          backgroundColor: '#e0e0e0',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#4CAF50',
            width: `${((chapters.findIndex(ch => ch.id === currentChapter) + 1) / chapters.length) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          {chapters.findIndex(ch => ch.id === currentChapter) + 1} / {chapters.length}
        </div>
      </div>
    </div>
  )

  // Render main content
  const renderMainContent = () => {
    const chapter = chapters.find(ch => ch.id === currentChapter)

    if (!chapter) return null

    return (
      <div style={{ marginLeft: '280px', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', rowGap: '8px', maxWidth: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: '0 0 10px 0',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>🔐 {t('app.title')}</h1>
              <p style={{
                margin: 0,
                opacity: 0.9,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{t('app.subtitle')}</p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main style={{ padding: '40px' }}>
          {/* Current chapter title */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {renderChapterIcon(chapter, '28px')}
              {t(chapter.titleKey)}
            </h2>
            <div style={{ height: '3px', width: '60px', backgroundColor: '#2196F3', borderRadius: '2px' }} />
          </div>

          {/* Wallet connection area */}
          {(currentChapter !== 'intro' && currentChapter !== 'conclusion') && (
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <ConnectButton />
              {isConnected && (
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>✅ {t('wallet.connected')}: <code>{address}</code></p>
                </div>
              )}
            </div>
          )}

          {/* Chapter content */}
          {currentChapter === 'intro' && renderIntroContent()}
          {currentChapter === 'conclusion' && renderConclusionContent()}
          {chapter.component && isConnected && React.createElement(chapter.component)}
          {chapter.component && !isConnected && renderWalletRequired()}
        </main>

        {/* Navigation buttons */}
        <div style={{
          padding: '20px 40px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {renderNavigationButton('prev')}
          {renderNavigationButton('next')}
        </div>

        {/* Footer */}
        <footer style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #dee2e6'
        }}>
          <p style={{ margin: 0, color: '#666' }}>
            {t('footer.text')} |{' '}
            <a
              href="https://github.com/MadeleineAguil/ZamaSchool"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2196F3', textDecoration: 'none' }}
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    )
  }

  // Render course introduction content
  const renderIntroContent = () => (
    <div>
      <div style={{
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0 }}>🎯 {t('intro.path_guide')}</h3>
        <p>{t('intro.welcome')}</p>

        <div style={{ display: 'grid', gap: '15px', marginTop: '25px' }}>
          {chapters.slice(1, -1).map((chapter, index) => (
            <div key={chapter.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {index + 1}
              </div>
              {renderChapterIcon(chapter, '20px')}
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {t(chapter.titleKey)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {getChapterDescription(chapter.id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '25px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h4>🔗 {t('intro.prep_title')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
          <div>
            <h5>📚 {t('intro.experience_title')}</h5>
            <ul style={{ fontSize: '14px' }}>
              <li>🎮 {t('intro.experience_1')}</li>
              <li>🔐 {t('intro.experience_2')}</li>
              <li>⚡ {t('intro.experience_3')}</li>
              <li>🌐 {t('intro.experience_4')}</li>
            </ul>
          </div>
          <div>
            <h5>🛡️ {t('intro.privacy_title')}</h5>
            <ul style={{ fontSize: '14px' }}>
              <li>🔒 {t('intro.privacy_1')}</li>
              <li>👤 {t('intro.privacy_2')}</li>
              <li>🔢 {t('intro.privacy_3')}</li>
              <li>🚫 {t('intro.privacy_4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  // Render learning summary content
  const renderConclusionContent = () => (
    <div style={{
      padding: '30px',
      backgroundColor: '#e3f2fd',
      borderRadius: '12px',
      border: '1px solid #2196F3'
    }}>
      <h3 style={{ marginTop: 0 }}>{t('conclusion.title')}</h3>
      <p>{t('conclusion.desc')}</p>
      <ul>
        <li>{t('conclusion.li1')}</li>
        <li>{t('conclusion.li2')}</li>
        <li>{t('conclusion.li3')}</li>
        <li>{t('conclusion.li4')}</li>
      </ul>

      <div style={{ marginTop: '25px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h4>{t('conclusion.next_steps')}</h4>
        <ul>
          <li>{t('conclusion.next1')}</li>
          <li>{t('conclusion.next2')}</li>
          <li>{t('conclusion.next3')}</li>
          <li>{t('conclusion.next4')}</li>
        </ul>
      </div>
    </div>
  )

  // Render wallet connection required prompt
  const renderWalletRequired = () => (
    <div style={{
      padding: '40px',
      backgroundColor: '#fff3cd',
      borderRadius: '8px',
      border: '1px solid #ffeaa7',
      textAlign: 'center'
    }}>
      <h3>🔗 {t('wallet.required.title')}</h3>
      <p>{t('wallet.required.desc')}</p>
      <div style={{ marginTop: '20px' }}>
        <ConnectButton />
      </div>
    </div>
  )

  // Render navigation buttons
  const renderNavigationButton = (direction) => {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter)
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    const targetChapter = chapters[targetIndex]

    if (!targetChapter) return <div />

    return (
      <button
        onClick={() => setCurrentChapter(targetChapter.id)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {direction === 'prev' && t('nav.prev')}
        {direction === 'next' && t('nav.next')}
        <span style={{ fontSize: '16px' }}>{targetChapter.icon}</span>
      </button>
    )
  }

  // Get chapter description
  const getChapterDescription = (chapterId) => {
    const map = {
      'zama-intro': 'desc.zama_intro',
      'sdk': 'desc.sdk',
      'number-storage': 'desc.number_storage',
      'number-decrypt': 'desc.number_decrypt',
      'address-storage': 'desc.address_storage',
      'address-decrypt': 'desc.address_decrypt',
      'onchain-decrypt': 'desc.onchain_decrypt',
      'calculations': 'desc.calculations',
      'number-comparison': 'desc.number_comparison'
    }
    const key = map[chapterId]
    return key ? t(key) : ''
  }

  return (
    <FHEVMProvider>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {renderSidebar()}
        {renderMainContent()}
      </div>
    </FHEVMProvider>
  )
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

export default App
