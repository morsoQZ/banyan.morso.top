import Link from "next/link";
import styles from "@/components/articles/article.module.css";

export default function ArticleNotFound() {
    return (
        <main className={`${styles.shell} ${styles.status}`}>
            <h1>文章不存在</h1>
            <p>这篇文章可能尚未发布、已经下架，或网址不正确。</p>
            <Link href="/" className={styles.homeLink}>
                返回首页
            </Link>
        </main>
    );
}
