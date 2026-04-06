import React from 'react'
import styles from './css/Header.module.css'


const Header = () => {
  return (
    <div className={styles.container}>
    <div flex className={styles.header}>
      <ul className={styles.nav}>
        <li>Alerts</li>
        <li>Analytics</li>
        <li>Settings</li>
        <li>Profile</li>
      </ul>
    </div>
    </div>
  )
}

export default Header
