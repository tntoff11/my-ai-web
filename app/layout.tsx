import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { Footer, GardenChat, Header } from './_components/SiteParts';
import './globals.css';

const vietnam = localFont({
  src: [
    { path: './fonts/NotoSans-Regular.woff', weight: '400', style: 'normal' },
    { path: './fonts/NotoSans-Bold.woff', weight: '700', style: 'normal' },
  ],
  variable: '--font-vietnam',
  display: 'swap',
  preload: true,
});
const editorial = localFont({
  src: './fonts/NotoSerif-Italic.woff',
  variable: '--font-editorial',
  style: 'italic',
  weight: '400',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: { default: 'Điểm Du Lịch Chuồn Chuồn | Coffee & Bistro', template: '%s | Chuồn Chuồn' },
  description: 'Vườn hoa, trò chơi, vườn thú mini và những trải nghiệm giữa thiên nhiên Nam Ban, Lâm Đồng.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body className={`${vietnam.variable} ${editorial.variable}`}>
    <div className="cc-site"><a className="skip-link" href="#noi-dung">Đến nội dung chính</a><Header /><main id="noi-dung">{children}</main><Footer /><GardenChat /></div>
  </body></html>;
}
