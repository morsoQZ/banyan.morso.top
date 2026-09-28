import Button from "@/components/ui/Button";
import styles from "./PageOne.module.css";
import { ShiningText } from "@/components/ui/ShiningText";

export default function PageOne() {
    return (
        <section className={styles.section}>
            <div className={styles.content}>
                <h1>古榕档案</h1>
                <div className={styles["brand-text"]}>
                    <span style={{ color: "#60cf6f" }}>banyan</span>
                    <ShiningText>{".morso.top"}</ShiningText>
                </div>

                <p>聚合杭下资讯、文章投稿与专题内容</p>
                <p>浏览发生过的故事</p>
                <p>查找你感兴趣的内容</p>
                <p>发现更多来自古榕树下的声音</p>
            </div>
            <div>
                <Button href="#page-two-title" is-highlighted>
                    向下探索
                </Button>
            </div>
        </section>
    );
}
