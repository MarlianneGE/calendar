/**
 * This file was generated from Calendar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListAttributeValue, ListExpressionValue } from "mendix";

export type DefaultViewEnum = "week" | "month";

export type HeaderEnum = "attribute" | "expression";

export type DescriptionEnum = "attribute" | "expression";

export type IsDatePickerEnum = "False" | "True";

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
    databaseDataSource?: ListValue;
    eventTypeAttribute?: ListAttributeValue<string>;
    allDayAttribute?: ListAttributeValue<boolean>;
    startAttribute?: ListAttributeValue<Date>;
    endAttribute?: ListAttributeValue<Date>;
    header: HeaderEnum;
    headerAttribute?: ListAttributeValue<string>;
    headerExpression?: ListExpressionValue<string>;
    description: DescriptionEnum;
    descriptionAttribute?: ListAttributeValue<string>;
    descriptionExpression?: ListExpressionValue<string>;
    eventBackgroundColor?: ListAttributeValue<string>;
    eventFontColor?: ListAttributeValue<string>;
    flags?: ListValue;
    flagDateAttribute?: ListAttributeValue<Date>;
    flagNameAttribute?: ListAttributeValue<string>;
    datesSelected?: ListValue;
    selectedDateAttr?: ListAttributeValue<Date>;
    isDatePicker: IsDatePickerEnum;
    clickedDate?: EditableValue<Date>;
    onClickEvent?: ActionValue;
    onClickEmpty?: ActionValue;
    onClickShowMore?: ActionValue;
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
    databaseDataSource: {} | { caption: string } | { type: string } | null;
    eventTypeAttribute: string;
    allDayAttribute: string;
    startAttribute: string;
    endAttribute: string;
    header: HeaderEnum;
    headerAttribute: string;
    headerExpression: string;
    description: DescriptionEnum;
    descriptionAttribute: string;
    descriptionExpression: string;
    eventBackgroundColor: string;
    eventFontColor: string;
    flags: {} | { caption: string } | { type: string } | null;
    flagDateAttribute: string;
    flagNameAttribute: string;
    datesSelected: {} | { caption: string } | { type: string } | null;
    selectedDateAttr: string;
    isDatePicker: IsDatePickerEnum;
    clickedDate: string;
    onClickEvent: {} | null;
    onClickEmpty: {} | null;
    onClickShowMore: {} | null;
}
