'use client';
import { Box, Button, Link, Paper } from "@mui/material"
import Logo from './assets/logo.png'
import { useSelectedLayoutSegment } from "next/navigation"

export const Header = () => {

  const menu = [
    {
        path: '/',
        label: "Home",
        segment: null
    },
  ]

  const segment = useSelectedLayoutSegment();

    return (
        <Paper style={{ height: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', paddingLeft: '24px', paddingRight: '24px' }}>
            <Link style={{ flex: 1, display: 'flex' }} href={'/'}>
                <img style={{ height: "40px" }} src={Logo.src} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {menu.map((menu_item) => (
                    <Link href={menu_item.path} key={menu_item.path}>
                        <div style={{ 
                            cursor: 'pointer',
                            borderBottom: menu_item.segment == segment ? '1px solid black' : undefined
                         }}>
                            {menu_item.label}
                        </div>
                    </Link>
                ))}
                <Link href="/join">
                    <Button size="small">Join</Button>
                </Link>
                <Link href="/login">
                    <Button size="small" variant="contained">Login</Button>
                </Link>
            </div>
        </Paper>
    )
}