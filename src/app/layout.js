import {
    Noto_Sans_SC,
    Noto_Serif_SC,
    Nunito,
    Sora,
    JetBrains_Mono,
    Montserrat,
} from "next/font/google";

import "./globals.css";
import TopBar from "@/components/layout/TopBar";

// 正文非衬线
const notoSansSC = Noto_Sans_SC({
    variable: "--font-noto-sans-sc",
    subsets: ["latin"],
    display: "swap",
});

// 正文衬线
const notoSerifSC = Noto_Serif_SC({
    variable: "--font-noto-serif-sc",
    subsets: ["latin"],
    display: "swap",
    preload: false,
});

// 圆润
const nunito = Nunito({
    variable: "--font-nunito",
    subsets: ["latin"],
    display: "swap",
    preload: false,
});

// 品牌
const sora = Sora({
    variable: "--font-sora",
    subsets: ["latin"],
    display: "swap",
});

// 编程等宽
const jetBrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    display: "swap",
    preload: false,
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    display: "swap",
    preload: false,
});

export const metadata = {
    title: "banyan.morso.top",
    description: "idk",
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <body>
                <TopBar />
                {children}
            </body>
        </html>
    );
}
