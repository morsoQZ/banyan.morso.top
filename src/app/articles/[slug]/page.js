import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import ArticleBody, { ArticleImage } from "@/components/articles/ArticleBody";
import styles from "@/components/articles/article.module.css";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeZone: "Asia/Shanghai",
});

// 同一篇文章用于页面内容和 SEO 信息。
async function requireArticle(params) {
    const { slug: encodedSlug } = await params;

    let slug;

    try {
        slug = decodeURIComponent(encodedSlug);
    } catch {
        notFound();
    }

    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return article;
}

export async function generateMetadata({ params }) {
    const article = await requireArticle(params);
    const title = article.meta.seo_title || article.title;
    const description = article.meta.search_description || article.summary;

    const cover = article.cover;
    const images =
        cover?.full_url && !cover.error
            ? [
                  {
                      url: cover.full_url,
                      alt: article.cover_alt || "",
                  },
              ]
            : [];

    return {
        title: `${title} | banyan.morso.top`,
        description,
        alternates: {
            canonical: article.meta.html_url,
        },
        openGraph: {
            type: "article",
            title,
            description,
            url: article.meta.html_url,
            locale: "zh_CN",
            publishedTime: article.meta.first_published_at,
            modifiedTime: article.meta.last_published_at,
            images,
        },
    };
}

export default async function ArticlePage({ params }) {
    const article = await requireArticle(params);
    const publishedAt = article.meta.first_published_at;

    return (
        <main className={styles.shell}>
            <Link href="/" className={styles.homeLink}>
                ← 返回首页
            </Link>

            <article>
                <header className={styles.header}>
                    <h1 className={styles.title}>{article.title}</h1>

                    {article.summary && (
                        <p className={styles.summary}>{article.summary}</p>
                    )}

                    {publishedAt && (
                        <p className={styles.meta}>
                            发布于{" "}
                            <time dateTime={publishedAt}>
                                {dateFormatter.format(new Date(publishedAt))}
                            </time>
                        </p>
                    )}
                </header>

                {article.cover && (
                    <div className={styles.cover}>
                        <ArticleImage
                            image={article.cover}
                            alt={article.cover_alt || ""}
                            eager
                        />
                    </div>
                )}

                <ArticleBody blocks={article.body} />
            </article>
        </main>
    );
}
