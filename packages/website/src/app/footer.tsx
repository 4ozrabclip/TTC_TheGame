import Link from "next/link"
import { Facebook, YouTube, Instagram } from '@mui/icons-material';
import { Typography } from "@mui/material";

export const Footer = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px',
            gap: '4px',
            background: 'gray'
        }}>
            <div style={{textAlign: 'center'}}>
                33 Main St, Otaki
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center'}}>
                <Link href={'https://www.facebook.com/profile.php?id=61572985917694'}>
                    <Facebook />
                </Link>
                <Link href={'https://www.instagram.com/copower.nz/'}>
                    <Instagram />
                </Link>
                <Link href={'https://www.youtube.com/@CoPowerNZ'}>
                    <YouTube />
                </Link>
                <Link href={'https://www.patreon.com/CoPowerNZ'}>
                    <Typography>Patreon</Typography>
                </Link>
            </div>
        </div>
    )
}