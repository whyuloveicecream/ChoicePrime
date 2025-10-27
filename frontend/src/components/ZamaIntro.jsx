import React from 'react'
import { useI18n } from '../contexts/I18nContext'

const ZamaIntro = () => {
  const { t } = useI18n()

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>🔐 {t('zama.title')}</h3>

      {/* What is Zama */}
      <div style={{ marginBottom: '30px', padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h4 style={{ marginTop: 0, color: '#2196F3' }}>🚀 {t('zama.what_is')}</h4>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          {t('zama.what_is_desc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <h5>🎯 {t('zama.core_tech')}</h5>
            <ul style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <li>{t('zama.core_tech_1')}</li>
              <li>{t('zama.core_tech_2')}</li>
              <li>{t('zama.core_tech_3')}</li>
              <li>{t('zama.core_tech_4')}</li>
            </ul>
          </div>
          <div>
            <h5>🌟 {t('zama.use_cases')}</h5>
            <ul style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <li>{t('zama.use_case_1')}</li>
              <li>{t('zama.use_case_2')}</li>
              <li>{t('zama.use_case_3')}</li>
              <li>{t('zama.use_case_4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FHE Technology Principles */}
      <div style={{ marginBottom: '30px', padding: '25px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196F3' }}>
        <h4 style={{ marginTop: 0, color: '#1976D2' }}>🔬 {t('zama.fhe_principles')}</h4>
        <div style={{ marginBottom: '20px' }}>
          <h5>{t('zama.traditional_vs_fhe')}</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #e57373' }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>❌ {t('zama.traditional')}</h6>
              <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {t('zama.traditional_desc')}
              </p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '6px', border: '1px solid #66bb6a' }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>✅ {t('zama.fhe')}</h6>
              <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {t('zama.fhe_desc')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h5>{t('zama.fhe_examples')}</h5>
          <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>{t('zama.traditional_approach')}</span><br/>
              <span style={{ color: '#1976D2' }}>decrypt(a) + decrypt(b) = result</span>
            </div>
            <div>
              <span style={{ color: '#666' }}>{t('zama.fhe_approach')}</span><br/>
              <span style={{ color: '#388e3c' }}>FHE.add(encrypted_a, encrypted_b) = encrypted_result</span>
            </div>
          </div>
        </div>
      </div>

      {/* FHEVM Architecture */}
      <div style={{ marginBottom: '30px', padding: '25px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800' }}>
        <h4 style={{ marginTop: 0, color: '#f57c00' }}>🏗️ {t('zama.architecture')}</h4>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          {t('zama.architecture_desc')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {[
            { key: 'solidity_lib', icon: '📚' },
            { key: 'kms', icon: '🔐' },
            { key: 'coprocessor', icon: '⚡' },
            { key: 'gateway', icon: '🌉' },
            { key: 'relayer', icon: '🔄' },
            { key: 'oracle', icon: '🔮' }
          ].map(item => (
            <div key={item.key} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>{item.icon} {t(`zama.${item.key}`)}</h6>
              <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                {t(`zama.${item.key}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Data Types */}
      <div style={{ marginBottom: '30px', padding: '25px', backgroundColor: '#fce4ec', borderRadius: '8px', border: '1px solid #e91e63' }}>
        <h4 style={{ marginTop: 0, color: '#c2185b' }}>🔢 {t('zama.data_types')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {['ebool', 'euints', 'eaddress', 'euint256'].map(type => (
            <div key={type} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
              <strong>{t(`zama.${type}`)}</strong><br/>
              <span style={{ fontSize: '12px', color: '#666' }}>{t(`zama.${type}_desc`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FHE Operations */}
      <div style={{ marginBottom: '30px', padding: '25px', backgroundColor: '#f3e5f5', borderRadius: '8px', border: '1px solid #9c27b0' }}>
        <h4 style={{ marginTop: 0, color: '#7b1fa2' }}>⚙️ {t('zama.operations')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <h6 style={{ color: '#7b1fa2' }}>🧮 {t('zama.arithmetic')}</h6>
            <ul style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <li>FHE.add() - Addition</li>
              <li>FHE.sub() - Subtraction</li>
              <li>FHE.mul() - Multiplication</li>
              <li>FHE.div() - Division</li>
            </ul>
          </div>
          <div>
            <h6 style={{ color: '#7b1fa2' }}>🔍 {t('zama.comparison')}</h6>
            <ul style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <li>FHE.eq() - Equal</li>
              <li>FHE.lt() - Less Than</li>
              <li>FHE.gt() - Greater Than</li>
              <li>FHE.le() - Less Than or Equal</li>
            </ul>
          </div>
          <div>
            <h6 style={{ color: '#7b1fa2' }}>🔀 {t('zama.logical')}</h6>
            <ul style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <li>FHE.and() - Logical AND</li>
              <li>FHE.or() - Logical OR</li>
              <li>FHE.not() - Logical NOT</li>
              <li>FHE.select() - Conditional Select</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div style={{ padding: '25px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #4caf50' }}>
        <h4 style={{ marginTop: 0, color: '#388e3c' }}>🎓 {t('zama.learning_journey')}</h4>
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          {t('zama.learning_journey_desc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h6 style={{ color: '#388e3c' }}>🔰 {t('zama.fundamentals')}</h6>
            <ul style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <li>{t('zama.fundamentals_1')}</li>
              <li>{t('zama.fundamentals_2')}</li>
              <li>{t('zama.fundamentals_3')}</li>
            </ul>
          </div>
          <div>
            <h6 style={{ color: '#388e3c' }}>🚀 {t('zama.advanced')}</h6>
            <ul style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <li>{t('zama.advanced_1')}</li>
              <li>{t('zama.advanced_2')}</li>
              <li>{t('zama.advanced_3')}</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center' }}>
          <strong style={{ color: '#388e3c' }}>💡 {t('zama.ready')}</strong>
        </div>
      </div>
    </div>
  )
}

export default ZamaIntro