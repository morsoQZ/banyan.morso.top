import "server-only";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import styles from "./article.module.css";

const richTextOptions = {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"],
    allowedAttributes: {
        a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
};

// 封面和正文图片共用这个组件。
export function ArticleImage({ image, alt = "", eager = false }) {
    if (
        !image?.full_url ||
        image.error ||
        !Number.isInteger(image.width) ||
        !Number.isInteger(image.height) ||
        image.width <= 0 ||
        image.height <= 0
    ) {
        return <p className={styles.imageFallback}>图片暂不可用</p>;
    }

    return (
        <Image
            src={image.full_url}
            alt={alt}
            width={image.width}
            height={image.height}
            className={styles.image}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            unoptimized
        />
    );
}

function BodyBlock({ block }) {
    const { type, value } = block;

    switch (type) {
        case "heading": {
            const Heading = value.level === "h3" ? "h3" : "h2";

            return <Heading id={`block-${block.id}`}>{value.text}</Heading>;
        }

        case "paragraph":
            return (
                <div
                    className={styles.richText}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(value, richTextOptions),
                    }}
                />
            );

        case "image":
            return (
                <figure className={styles.figure}>
                    <ArticleImage
                        image={value.image}
                        alt={value.image?.alt || ""}
                    />
                    {value.caption && <figcaption>{value.caption}</figcaption>}
                </figure>
            );

        case "quote":
            return (
                <blockquote className={styles.quote}>
                    <p>{value.text}</p>
                    {value.source && <footer>— {value.source}</footer>}
                </blockquote>
            );

        case "code":
            return (
                <figure className={styles.code}>
                    <figcaption>{value.language}</figcaption>
                    <pre tabIndex={0}>
                        <code>{value.code}</code>
                    </pre>
                </figure>
            );

        default:
            throw new Error(`尚未支持的文章正文类型：${type}`);
    }
}

export default function ArticleBody({ blocks }) {
    return (
        <div className={styles.body}>
            {blocks.map((block) => (
                <BodyBlock key={block.id} block={block} />
            ))}
        </div>
    );
}
