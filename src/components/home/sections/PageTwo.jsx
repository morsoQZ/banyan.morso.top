import styles from "./PageTwo.module.css";

export default function PageTwo() {
    return (
        <section className={styles.section}>
            <div className={styles.content}>
                <h2 id="page-two-title" data-reveal="">
                    整理散落的故事
                </h2>
                <p data-reveal="">按上传时间排序</p>
            </div>
        </section>
    );
}
