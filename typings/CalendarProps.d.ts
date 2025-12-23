/**
 * This file was generated from Calendar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListAttributeValue, ListExpressionValue, ListWidgetValue } from "mendix";
import { Big } from "big.js";

export type DefaultViewEnum = "week" | "month" | "agenda";

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
    quarterStart?: EditableValue<Big>;
    quarterEnd?: EditableValue<Big>;
    userTimeZone: EditableValue<string>;
    localeAttribute?: EditableValue<string>;
    weekStartInt?: EditableValue<Big>;
    databaseDataSource?: ListValue;
    eventTypeAttribute?: ListAttributeValue<string>;
    allDayAttribute?: ListAttributeValue<boolean>;
    startAttribute?: ListAttributeValue<Big>;
    endAttribute?: ListAttributeValue<Big>;
    header: HeaderEnum;
    headerAttribute?: ListAttributeValue<string>;
    headerExpression?: ListExpressionValue<string>;
    description: DescriptionEnum;
    descriptionAttribute?: ListAttributeValue<string>;
    descriptionExpression?: ListExpressionValue<string>;
    eventBackgroundColor?: ListAttributeValue<string>;
    eventFontColor?: ListAttributeValue<string>;
    agendaEventTemplate?: ListWidgetValue;
    flags?: ListValue;
    flagDateAttribute?: ListAttributeValue<Date>;
    flagNameAttribute?: ListAttributeValue<string>;
    datesSelected?: ListValue;
    selectedDateAttr?: ListAttributeValue<Date>;
    isDatePicker: IsDatePickerEnum;
    clickedDate?: EditableValue<Date>;
    onClickEmpty?: ActionValue;
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
    userTimeZone: string;
    localeAttribute: string;
    weekStartInt: string;
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
    agendaEventTemplate: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    flags: {} | { caption: string } | { type: string } | null;
    flagDateAttribute: string;
    flagNameAttribute: string;
    datesSelected: {} | { caption: string } | { type: string } | null;
    selectedDateAttr: string;
    isDatePicker: IsDatePickerEnum;
    clickedDate: string;
    onClickEmpty: {} | null;
}
