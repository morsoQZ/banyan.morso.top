"use client";

import Link from "next/link";
import styles from "@/components/articles/article.module.css";

export default function ArticleError({ retry }) {
    return (
        <main className={`${styles.shell} ${styles.status}`}>
            <h1>文章暂时无法加载</h1>
            <p>服务暂时出现问题，请稍后重试。</p>

            <button
                type="button"
                className={styles.action}
                onClick={() => retry()}
            >
                重新加载
            </button>

            <Link href="/" className={styles.homeLink}>
                返回首页
            </Link>
        </main>
    );
}
