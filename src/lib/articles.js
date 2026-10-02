import "server-only";
import { cache } from "react";

// 请求文章 API，统一处理地址、超时和 HTTP 错误。
async function request(path, query = {}, allowNotFound = false) {
    const baseUrl = process.env.CMS_API_BASE_URL;

    if (!baseUrl) {
        throw new Error("缺少 CMS_API_BASE_URL 环境变量");
    }

    const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

    for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
    }

    let response;

    try {
        response = await fetch(url, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
        });
    } catch (cause) {
        throw new Error("文章后端请求失败：连接异常或请求超时", {
            cause,
        });
    }

    if (response.status === 404 && allowNotFound) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`文章后端返回 HTTP ${response.status}`);
    }

    return response.json();
}

// 检查文章最基本的数据结构。
function validateArticle(article) {
    if (
        !article ||
        !Number.isSafeInteger(article.id) ||
        article.id < 1 ||
        typeof article.title !== "string" ||
        typeof article.meta?.slug !== "string"
    ) {
        throw new Error("文章 API 返回的数据格式不正确");
    }
}

// 获取文章列表，支持分页和按 slug 筛选。
export async function getArticles({ limit = 12, offset = 0, slug } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new TypeError("limit 必须是 1 到 50 之间的整数");
    }

    if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new TypeError("offset 必须是非负整数");
    }

    const query = { limit, offset };

    if (slug !== undefined) {
        if (typeof slug !== "string" || !slug.trim()) {
            throw new TypeError("slug 必须是非空字符串");
        }

        query.slug = slug;
    }

    const data = await request("articles/", query);

    if (
        !Array.isArray(data?.items) ||
        !Number.isSafeInteger(data.meta?.total_count) ||
        data.meta.total_count < 0
    ) {
        throw new Error("文章列表 API 返回的数据格式不正确");
    }

    data.items.forEach(validateArticle);

    return data;
}

// 获取包含正文的文章详情；文章不存在时返回 null。
export const getArticleById = cache(async function getArticleById(id) {
    if (!Number.isSafeInteger(id) || id < 1) {
        throw new TypeError("文章 id 必须是正整数");
    }

    const article = await request(`articles/${id}/`, {}, true);

    if (article === null) {
        return null;
    }

    validateArticle(article);

    if (!Array.isArray(article.body)) {
        throw new Error("文章详情 API 没有返回正确的正文");
    }

    return article;
});

// 按 slug 查找文章，再通过 id 获取完整正文。
export const getArticleBySlug = cache(async function getArticleBySlug(slug) {
    const { items } = await getArticles({ slug, limit: 1 });

    if (items.length === 0) {
        return null;
    }

    return getArticleById(items[0].id);
});
