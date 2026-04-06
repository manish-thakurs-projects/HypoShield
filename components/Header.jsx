'use client'

import Link from 'next/link'
import styles from './css/Header.module.css'

const Header = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>


        <ul className={styles.nav}>
          <li><Link href="/alerts">Alerts</Link></li>
          <li><Link href="/analytics">Analytics</Link></li>
          <li><Link href="/history">History</Link></li>
        </ul>

      </div>
    </div>
  )
}

export default Header