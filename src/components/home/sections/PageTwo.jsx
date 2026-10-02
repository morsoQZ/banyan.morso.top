import Link from "next/link";
import styles from "./PageTwo.module.css";

export default function PageTwo() {
    return (
        <section className={styles.section}>
            <div className={styles.content}>
                <h2 id="page-two-title" data-reveal="">
                    整理散落的故事
                </h2>

                <p data-reveal="">按发布时间排序</p>

                <Link
                    href="/articles"
                    className={styles.articleLink}
                    data-reveal=""
                >
                    浏览文章 →
                </Link>
            </div>
        </section>
    );
}
