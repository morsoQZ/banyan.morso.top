from wagtail import blocks
from wagtail.images.blocks import ImageBlock


class HeadingBlock(blocks.StructBlock):
    text = blocks.CharBlock(label="标题文字", max_length=200)
    level = blocks.ChoiceBlock(
        choices=[("h2", "二级标题"), ("h3", "三级标题")],
        default="h2",
        label="标题级别",
    )

    class Meta:
        label = "小标题"
        icon = "title"


class ArticleImageBlock(blocks.StructBlock):
    image = ImageBlock(label="图片")
    caption = blocks.CharBlock(
        label="图注",
        required=False,
        max_length=300,
    )

    class Meta:
        label = "图片"
        icon = "image"


class QuoteBlock(blocks.StructBlock):
    text = blocks.TextBlock(label="引用内容")
    source = blocks.CharBlock(
        label="来源",
        required=False,
        max_length=200,
    )

    class Meta:
        label = "引用"
        icon = "openquote"


class CodeBlock(blocks.StructBlock):
    language = blocks.ChoiceBlock(
        choices=[
            ("text", "纯文本"),
            ("python", "Python"),
            ("javascript", "JavaScript"),
            ("typescript", "TypeScript"),
            ("html", "HTML"),
            ("css", "CSS"),
            ("bash", "Bash"),
            ("sql", "SQL"),
            ("json", "JSON"),
        ],
        default="text",
        label="语言",
    )
    code = blocks.TextBlock(label="代码")

    class Meta:
        label = "代码"
        icon = "code"


class ArticleBodyBlock(blocks.StreamBlock):
    heading = HeadingBlock()
    paragraph = blocks.RichTextBlock(
        label="段落",
        features=["bold", "italic", "link", "ol", "ul"],
    )
    image = ArticleImageBlock()
    quote = QuoteBlock()
    code = CodeBlock()