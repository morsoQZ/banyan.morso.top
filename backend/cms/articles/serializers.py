from rest_framework.fields import Field
from wagtail.images.api.fields import ImageRenditionField


class ArticleBodySerializer(Field):
    def to_representation(self, value):
        data = value.stream_block.get_api_representation(
            value, context=self.context
        )

        for block, item in zip(value, data):
            if block.block_type != "image":
                continue

            image = block.value["image"]
            if image is None:
                item["value"]["image"] = None
                continue

            image_data = ImageRenditionField(
                "max-1600x1600"
            ).to_representation(image)

            image_data["alt"] = image.contextual_alt_text or ""
            item["value"]["image"] = image_data

        return data