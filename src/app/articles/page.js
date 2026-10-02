import Link from "next/link";
import { redirect } from "next/navigation";
import { getArticles } from "@/lib/articles";
import { ArticleImage } from "@/components/articles/ArticleBody";
import articleStyles from "@/components/articles/article.module.css";
import styles from "./page.module.css";

const PAGE_SIZE = 12;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeZone: "Asia/Shanghai",
});

function pageHref(page) {
    return page === 1 ? "/articles" : `/articles?page=${page}`;
}

// 无效页码返回第一页，避免把错误参数传给后端。
function readPageNumber(raw) {
    if (raw === undefined) {
        return 1;
    }

    if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
        redirect("/articles");
    }

    const page = Number(raw);
    const offset = (page - 1) * PAGE_SIZE;

    if (
        !Number.isSafeInteger(page) ||
        !Number.isSafeInteger(offset) ||
        page === 1
    ) {
        redirect("/articles");
    }

    return page;
}

export async function generateMetadata({ searchParams }) {
    const query = await searchParams;
    const page = readPageNumber(query.page);

    return {
        title:
            page === 1
                ? "文章 | banyan.morso.top"
                : `文章 · 第 ${page} 页 | banyan.morso.top`,
        description: "浏览 Banyan 已发布的文章。",
    };
}

export default async function ArticlesPage({ searchParams }) {
    const query = await searchParams;
    const page = readPageNumber(query.page);

    const { items, meta } = await getArticles({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    });

    const total = meta.total_count;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // 文章下架后，原来的最后一页可能不再存在。
    if (page > totalPages) {
        redirect(pageHref(totalPages));
    }

    return (
        <main className={articleStyles.shell}>
            <Link href="/" className={articleStyles.homeLink}>
                ← 返回首页
            </Link>

            <header className={articleStyles.header}>
                <h1 className={articleStyles.title}>文章</h1>
                <p className={articleStyles.summary}>
                    共 {total} 篇已发布文章，按发布时间由新到旧排列。
                </p>
            </header>

            {items.length === 0 ? (
                <p className={styles.empty}>还没有已发布的文章。</p>
            ) : (
                <ul className={styles.list} role="list">
                    {items.map((article, index) => {
                        const publishedAt = article.meta.first_published_at;

                        return (
                            <li key={article.id} className={styles.card}>
                                <Link
                                    href={`/articles/${encodeURIComponent(article.meta.slug)}`}
                                    className={styles.cardLink}
                                >
                                    {article.cover && (
                                        <div className={styles.thumbnail}>
                                            <ArticleImage
                                                image={article.cover}
                                                alt=""
                                                eager={index < 2}
                                            />
                                        </div>
                                    )}

                                    <h2 className={styles.cardTitle}>
                                        {article.title}
                                    </h2>

                                    <p className={styles.cardSummary}>
                                        {article.summary}
                                    </p>

                                    {publishedAt && (
                                        <time
                                            dateTime={publishedAt}
                                            className={styles.cardDate}
                                        >
                                            {dateFormatter.format(
                                                new Date(publishedAt),
                                            )}
                                        </time>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="文章分页">
                    {page > 1 ? (
                        <Link href={pageHref(page - 1)}>← 上一页</Link>
                    ) : (
                        <span className={styles.disabled}>← 上一页</span>
                    )}

                    <span aria-current="page">
                        第 {page} / {totalPages} 页
                    </span>

                    {page < totalPages ? (
                        <Link href={pageHref(page + 1)}>下一页 →</Link>
                    ) : (
                        <span className={styles.disabled}>下一页 →</span>
                    )}
                </nav>
            )}
        </main>
    );
}
