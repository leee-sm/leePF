from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


Id = Annotated[str, StringConstraints(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")]
ShortText = Annotated[str, StringConstraints(min_length=1, max_length=120)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FilterConfig(StrictModel):
    id: Literal["as_of_date", "manufacturer", "model"]
    label: ShortText
    default: Any
    required: bool = False


class MetricWidget(StrictModel):
    id: Id
    type: Literal["metric"]
    title: Annotated[str, StringConstraints(max_length=120)] = ""
    metric_id: str = "inventory_count"
    width: Literal[3, 4, 6, 12] = 3
    decimals: int = Field(default=0, ge=0, le=2)


class BarWidget(StrictModel):
    id: Id
    type: Literal["bar"]
    title: Annotated[str, StringConstraints(max_length=120)] = ""
    metric_id: str = "inventory_count"
    dimension_id: Literal["manufacturer", "model"]
    width: Literal[3, 4, 6, 12] = 6
    sort: Literal["value_desc", "value_asc", "label_asc"] = "value_desc"
    limit: Literal[5, 10, 20] = 10


class TableWidget(StrictModel):
    id: Id
    type: Literal["table"]
    title: Annotated[str, StringConstraints(max_length=120)] = ""
    dimension_ids: list[Literal["manufacturer", "model"]] = Field(min_length=1, max_length=2)
    metric_ids: list[str] = Field(min_length=1, max_length=1)
    width: Literal[3, 4, 6, 12] = 12
    sort: Literal["value_desc", "value_asc", "label_asc"] = "value_desc"
    page_size: Literal[20, 50, 100] = 20


Widget = Annotated[MetricWidget | BarWidget | TableWidget, Field(discriminator="type")]


class DashboardConfig(StrictModel):
    schema_version: Literal[1] = 1
    title: ShortText
    description: Annotated[str, StringConstraints(max_length=500)] = ""
    source_id: Literal["inventory"] = "inventory"
    filters: list[FilterConfig] = Field(default_factory=list, max_length=6)
    widgets: list[Widget] = Field(default_factory=list, max_length=12)


class CreateDashboard(StrictModel):
    title: ShortText
    description: Annotated[str, StringConstraints(max_length=500)] = ""
    source_id: Literal["inventory"] = "inventory"
    template_id: Literal["inventory_overview"] | None = None


class SaveDraft(StrictModel):
    config: DashboardConfig
    expected_edit_version: int = Field(ge=1)


class PreviewRequest(StrictModel):
    config: DashboardConfig
    filters: dict[str, Any] = Field(default_factory=dict)
    tables: dict[str, dict[str, Any]] = Field(default_factory=dict)


class PublishRequest(StrictModel):
    expected_edit_version: int = Field(ge=1)
    expected_published_revision: int = Field(ge=0)


class UnpublishRequest(StrictModel):
    expected_published_revision: int = Field(ge=0)


class QueryRequest(StrictModel):
    published_revision: int = Field(ge=1)
    filters: dict[str, Any] = Field(default_factory=dict)
    tables: dict[str, dict[str, Any]] = Field(default_factory=dict)
    widget_ids: list[Id] | None = None
