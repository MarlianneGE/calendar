/**
 * This file was generated from Calendar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListAttributeValue, ListExpressionValue } from "mendix";

export type DefaultViewEnum = "week" | "month";

export type Text1Enum = "attribute" | "expression";

export type Text2Enum = "attribute" | "expression";

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
    dateExpression?: DynamicValue<Date>;
    viewAttribute?: EditableValue<string>;
    defaultView: DefaultViewEnum;
    displayType?: EditableValue<string>;
    quarterStart?: DynamicValue<Date>;
    quarterEnd?: DynamicValue<Date>;
    timeslotEvents?: ListValue;
    timeslotStartAttribute?: ListAttributeValue<Date>;
    databaseDataSource?: ListValue;
    eventTypeAttribute?: ListAttributeValue<string>;
    allDayAttribute?: ListAttributeValue<boolean>;
    startAttribute?: ListAttributeValue<Date>;
    endAttribute?: ListAttributeValue<Date>;
    text1: Text1Enum;
    text1Attribute?: ListAttributeValue<string>;
    text1Expression?: ListExpressionValue<string>;
    text2: Text2Enum;
    text2Attribute?: ListAttributeValue<string>;
    text2Expression?: ListExpressionValue<string>;
    eventBackgroundColor?: ListAttributeValue<string>;
    eventFontColor?: ListAttributeValue<string>;
    datesSelected?: ListValue;
    selectedDateAttr?: ListAttributeValue<Date>;
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
    dateExpression: string;
    viewAttribute: string;
    defaultView: DefaultViewEnum;
    displayType: string;
    quarterStart: string;
    quarterEnd: string;
    timeslotEvents: {} | { caption: string } | { type: string } | null;
    timeslotStartAttribute: string;
    databaseDataSource: {} | { caption: string } | { type: string } | null;
    eventTypeAttribute: string;
    allDayAttribute: string;
    startAttribute: string;
    endAttribute: string;
    text1: Text1Enum;
    text1Attribute: string;
    text1Expression: string;
    text2: Text2Enum;
    text2Attribute: string;
    text2Expression: string;
    eventBackgroundColor: string;
    eventFontColor: string;
    datesSelected: {} | { caption: string } | { type: string } | null;
    selectedDateAttr: string;
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
