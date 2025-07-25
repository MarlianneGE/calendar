/**
 * This file was generated from Calendar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue, ListValue, ListAttributeValue, ListExpressionValue } from "mendix";

export type InfoTypeEnum = "attribute" | "expression";

export type TitleTypeEnum = "attribute" | "expression";

export type ViewEnum = "standard" | "dashboard";

export type EditableEnum = "default" | "never";

export type DefaultViewEnum = "day" | "week" | "month" | "work_week" | "agenda";

export type WidthUnitEnum = "pixels" | "percentage";

export type HeightUnitEnum = "percentageOfWidth" | "pixels" | "percentageOfParent" | "percentageOfView";

export type MinHeightUnitEnum = "none" | "pixels" | "percentageOfParent" | "percentageOfView";

export type MaxHeightUnitEnum = "none" | "pixels" | "percentageOfParent" | "percentageOfView";

export type OverflowYEnum = "auto" | "scroll" | "hidden";

export interface CalendarContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    databaseDataSource?: ListValue;
    dateAttribute?: EditableValue<Date>;
    viewAttribute?: EditableValue<string>;
    eventTypeAttribute?: ListAttributeValue<string>;
    filterType?: ListAttributeValue<string>;
    iconAttribute?: ListAttributeValue<string>;
    infoType: InfoTypeEnum;
    infoAttribute?: ListAttributeValue<string>;
    infoExpression?: ListExpressionValue<string>;
    titleType: TitleTypeEnum;
    titleAttribute?: ListAttributeValue<string>;
    titleExpression?: ListExpressionValue<string>;
    allDayAttribute?: ListAttributeValue<boolean>;
    startAttribute?: ListAttributeValue<Date>;
    endAttribute?: ListAttributeValue<Date>;
    eventBackgroundColor?: ListAttributeValue<string>;
    eventFontColor?: ListAttributeValue<string>;
    view: ViewEnum;
    editable: EditableEnum;
    enableCreate: boolean;
    defaultView: DefaultViewEnum;
    clickedDate?: EditableValue<Date>;
    onClickEvent?: ActionValue;
    onClickEmpty?: ActionValue;
    onClickShowMore?: ActionValue;
    widthUnit: WidthUnitEnum;
    width: number;
    heightUnit: HeightUnitEnum;
    height: number;
    minHeightUnit: MinHeightUnitEnum;
    minHeight: number;
    maxHeightUnit: MaxHeightUnitEnum;
    maxHeight: number;
    overflowY: OverflowYEnum;
}

export interface CalendarPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    databaseDataSource: {} | { caption: string } | { type: string } | null;
    dateAttribute: string;
    viewAttribute: string;
    eventTypeAttribute: string;
    filterType: string;
    iconAttribute: string;
    infoType: InfoTypeEnum;
    infoAttribute: string;
    infoExpression: string;
    titleType: TitleTypeEnum;
    titleAttribute: string;
    titleExpression: string;
    allDayAttribute: string;
    startAttribute: string;
    endAttribute: string;
    eventBackgroundColor: string;
    eventFontColor: string;
    view: ViewEnum;
    editable: EditableEnum;
    enableCreate: boolean;
    defaultView: DefaultViewEnum;
    clickedDate: string;
    onClickEvent: {} | null;
    onClickEmpty: {} | null;
    onClickShowMore: {} | null;
    widthUnit: WidthUnitEnum;
    width: number | null;
    heightUnit: HeightUnitEnum;
    height: number | null;
    minHeightUnit: MinHeightUnitEnum;
    minHeight: number | null;
    maxHeightUnit: MaxHeightUnitEnum;
    maxHeight: number | null;
    overflowY: OverflowYEnum;
}
