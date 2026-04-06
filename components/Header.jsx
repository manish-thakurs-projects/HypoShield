'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './css/Header.module.css'

const Header = () => {
  const pathname = usePathname()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ul className={styles.nav}>
          <li className={pathname === '/' ? styles.active : ''}>
            <Link href="/">Home</Link>
          </li>

          <li className={pathname === '/alerts' ? styles.active : ''}>
            <Link href="/alerts">Alerts</Link>
          </li>

          <li className={pathname === '/analytics' ? styles.active : ''}>
            <Link href="/analytics">Analytics</Link>
          </li>

          <li className={pathname === '/history' ? styles.active : ''}>
            <Link href="/history">History</Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Header