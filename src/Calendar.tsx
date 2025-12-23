// main entry point for the widget; all props will come in from here.
import classnames from "classnames";
import { ReactElement, createElement, useMemo, useEffect, useState } from "react"; 
import { Calendar, luxonLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarContainerProps } from "../typings/CalendarProps";
import { DateTime, Settings } from 'luxon'

const defaultTZ = DateTime.local().zoneName
const defaultDateStr = '2015-04-13'

function getDate(str: string, DateTimeObj: typeof DateTime): Date {
  // If 'str' is corrupt (e.g., '2015-99-13'), or if Luxon fails to parse it
  // due to the current zone settings, 'fromISO' might return an invalid date.
  const luxonDate = DateTimeObj.fromISO(str);

  if (!luxonDate.isValid) {
    console.error("Luxon failed to parse date string:", str, "in timezone:", Settings.defaultZone);
    // Return a valid date as a fallback 
    return new Date(); 
  }

  return luxonDate.toJSDate();
}

const CustomWeekEvent = ({ event }: { event: CalEvent }) => {
     const { header, allDay, description } = event;
    return allDay ? (
        <div className={`allDay-event`}>
            <p>{header}</p>
            <strong>{description}</strong>
        </div>
    ) : (
        <div className={`timed-event`}>
            <p>{header}</p>
            <strong>{description}</strong>
        </div>
    );
};

interface CustomMonthEventProps {
    event: CalEvent;
    onShowMoreClick?: (date: Date) => void;
    stableZone: string;
}

// Event content is customized based on icons or eventInfo display  
const CustomMonthEvent = ({ event, onShowMoreClick, stableZone }: CustomMonthEventProps) => {
const today = DateTime.now().setZone(stableZone).startOf('day');
    const eventEnd = DateTime.fromJSDate(event.end, { zone: stableZone });
    const isPast = eventEnd < today;
    const dimClass = isPast ? "rbc-day-dimmed" : "";

    let eventDate;
    const startStr = DateTime.fromJSDate(event.start, { zone: stableZone }).toFormat("MM-dd");
    const endStr = DateTime.fromJSDate(event.end, { zone: stableZone }).toFormat("MM-dd");
    if (startStr === endStr) {
        eventDate = `date-${startStr}`; 
    } else {
        eventDate = `date-${startStr}-to-${endStr}`; 
    }

    if (event.display === "icons" && event.icons && event.icons.length > 0) {
        const maxToShow = 3;

        const visibleIconData = event.icons
            .filter(item => Array.isArray(item) && item.length === 2) as IconDataTuple[];

        const visible = visibleIconData.slice(0, maxToShow);
        const hiddenCount = event.icons.length - visible.length;

        return (
            <div className={`icon-row ${dimClass}`}>
                <div className="circle-row">
                    {visibleIconData.map(([eventType, eventColor], i) => (
                        <span
                            key={i}
                            className={`color-circle a_${eventDate} a_type-${eventType}`} 
                            style={{ backgroundColor: eventColor }} 
                            title={eventType}
                        />
                    ))}
                </div>

                {hiddenCount > 0 && (
                    <div className="show-more-row">
                        <span
                            className="show-more"
                            title={`+${hiddenCount} more`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowMoreClick?.(event.start);
                            }}
                        >
                            +{hiddenCount}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    if (event.display === "eventinfo") {
        return (
            <div className={`event-info ${dimClass} a_${eventDate} a_type-${event.type}`}>
                <p>{event.header}</p>
                <strong>{event.description}</strong>
            </div>
        );
    }

    return null;
};



function groupIconEventsByDay(events: CalEvent[], view: string ): CalEvent[] {
    if (view !== "month") return events;

    const groupedMap = new Map<string, CalEvent>();
    const result: CalEvent[] = [];

    for (const event of events) {
        if (event.display === "eventinfo") {
            // Keep regular event info events ungrouped
            result.push(event);
            continue;
        }

        if (event.display === "icons") {
            // The event.start date is already in the correct timezone context.
            // We just need to format it to get a consistent key for grouping.
            const dayKey = DateTime.fromJSDate(event.start).toISODate() || '';

            const eventType = event.type || "unknown";
            const eventColor = event.fontColor || "#999";
            const iconData: [string, string] = [eventType, eventColor]; // [Type, Color]


            if (!groupedMap.has(dayKey)) {
                groupedMap.set(dayKey, {
                    ...event,
                    display: "icons",
                    description: "",            // suppress description
                    icons: [iconData],
                });
            } else {
                const grouped = groupedMap.get(dayKey)!;
                (grouped.icons ||= []).push(iconData);
            }
        }
    }

    return [...result, ...groupedMap.values()];
}

type IconDataTuple = [string, string];

interface CalEvent {
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    display: string;
    // optional: 
    icons?: Array<string | IconDataTuple>;
    fontColor?: string;
    backgroundColor?: string;
    header?: string;
    type?: string;
    item?: any;
}

export default function MxCalendar(props: CalendarContainerProps): ReactElement {
    const { class: className } = props;

    // currentView will be "month" if "quarter" is selected 
    const rawView = props.viewAttribute?.value ?? props.defaultView;

    // When 'day' is selected, use the 'agenda' view to create a list view for that single day.
    // When 'quarter' is selected, use the 'month' view to show the quarter's months. 
    const currentView = rawView === "quarter" ? "month" 
        : rawView === "day" ? "agenda" : rawView;

    const isDatePicker = props.isDatePicker;
    const items = props.databaseDataSource?.items ?? [];

    const timezoneFromProp = props.userTimeZone.value?? defaultTZ;
    const selectedTimezone: string = 
        (timezoneFromProp && timezoneFromProp.trim() !== '') ? timezoneFromProp : defaultTZ;

    const rawLocale = props.localeAttribute?.value;
    // Mendix often uses underscores (en_US), but Luxon/Intl requires hyphens (en-US)
    const locale = rawLocale ? rawLocale.replace(/_/g, "-").trim() : undefined;
    const rawWeekStart = (props as any).weekStartInt?.value;
    const weekStartInt = rawWeekStart !== undefined && rawWeekStart !== null ? Number(rawWeekStart) : undefined;

    // Prevent calendar from flickering during timezone change 
    const [stableZone, setStableZone] = useState(selectedTimezone);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (Settings.defaultZone.name !== selectedTimezone) {
            // Signal that we are starting a timezone change operation
            setIsProcessing(true); 
            // Apply the timezone change
            Settings.defaultZone = selectedTimezone; 

            const timer = setTimeout(() => {
                setStableZone(selectedTimezone);
                setIsProcessing(false);
            }, 0); 
            return () => clearTimeout(timer);
        }
    }, [selectedTimezone]);
    
    useEffect(() => {
        const originalLocale = Settings.defaultLocale;
        return () => {
            Settings.defaultZone = defaultTZ; // reset to browser TZ on unmount
            Settings.defaultLocale = originalLocale; // reset locale on unmount
        }
    }, [])

    useEffect(() => {
        if (locale) {
            try {
                Settings.defaultLocale = locale;
            } catch (e) {
                console.warn("Invalid locale:", locale, e);
            }
        }
    }, [locale]);

    const rawEvents: CalEvent[] = items.map(item => {
        const header =
            props.header === "attribute" && props.headerAttribute
                ? (props.headerAttribute.get(item).value ?? "")
                : props.header === "expression" && props.headerExpression
                  ? (props.headerExpression.get(item).value ?? "")
                  : "";

        const description =
            props.description === "attribute" && props.descriptionAttribute
                ? (props.descriptionAttribute.get(item).value ?? "")
                : props.description === "expression" && props.descriptionExpression
                  ? (props.descriptionExpression.get(item).value ?? "")
                  : "";

        const rawStart = props.startAttribute?.get(item).value; // epoch
        const rawEnd = props.endAttribute?.get(item).value; // epoch 
        // Convert Epoch to JS Date via Luxon using the selected timezone
        const start = rawStart 
            ? DateTime.fromMillis(Number(rawStart), { zone: stableZone }).toJSDate() 
            : new Date();
        const end = rawEnd 
            ? DateTime.fromMillis(Number(rawEnd), { zone: stableZone }).toJSDate() 
            : start;

        const allDay = props.allDayAttribute?.get(item).value ?? false;
        const fontColor = props.eventFontColor?.get(item).value;
        const backgroundColor = props.eventBackgroundColor?.get(item).value;
        const rawdisplay = props.displayType?.value;
        const display = rawdisplay ? rawdisplay.toString().toLowerCase() : "";
        const type = props.eventTypeAttribute?.get(item)?.value ?? ""; 

        return { description, start, end, fontColor, backgroundColor, allDay, display, header, type, item }; 
    });

    const rawQuarterStart = props.quarterStart?.value ? Number(props.quarterStart.value) : undefined; // epoch
    const rawQuarterEnd = props.quarterEnd?.value ? Number(props.quarterEnd.value) : undefined; // epoch

    // Luxon DateTime objects for quarter boundaries 
    // Don't adjust time by timezone: ie. if end of quarter is Dec 31, keep end of quarter as Dec 31 regardless of timezone 
    const quarterStartLuxon = rawQuarterStart
        ? DateTime.fromMillis(Number(rawQuarterStart), { zone: "UTC" }).setZone(stableZone, { keepLocalTime: true })
        : DateTime.now().setZone(stableZone).startOf("day"); // fallback

    const quarterEndLuxon = (rawQuarterEnd
        ? DateTime.fromMillis(Number(rawQuarterEnd), { zone: "UTC" }).setZone(stableZone, { keepLocalTime: true })
        : quarterStartLuxon.endOf("month") // fallback
    ).endOf("day");

    const isInQuarter = (date: Date): boolean => {
        const d = DateTime.fromJSDate(date, { zone: stableZone });
        return d >= quarterStartLuxon && d <= quarterEndLuxon;
    };

// Events processing: expand multi-day events and filter/adjust based on quarter boundaries
function expandMultiDayEvents(
    events: CalEvent[],
    view: string,
    stableZone: string,
    quarterStartLuxon: DateTime,
    quarterEndLuxon: DateTime
): CalEvent[] {
    const expandedEvents: CalEvent[] = [];
    
    events.forEach(event => {
        let luxonStart = DateTime.fromJSDate(event.start, { zone: stableZone });
        let luxonEnd = DateTime.fromJSDate(event.end, { zone: stableZone });

        // Check if the event actually overlaps with the quarter
        const overlapsQuarter = luxonStart <= quarterEndLuxon && luxonEnd >= quarterStartLuxon;

        // true if any part of the event's date range falls within the quarter's date range
        if (!overlapsQuarter) {
            return; // Event is not in the quarter, so skip it
        }

        const isMultiDay = luxonStart.toISODate() !== luxonEnd.toISODate();
        const shouldChunk = event.display === "icons" && view === "month";

        // chunk events that are more than 1 day when display is icons
        if (isMultiDay && shouldChunk) {
            let currentDayIter = luxonStart.startOf('day');
            const endDayIter = luxonEnd.startOf('day');

            while (currentDayIter <= endDayIter) {
                // Only chunk if the current day is within the quarter
                if (currentDayIter.endOf('day') >= quarterStartLuxon && currentDayIter <= quarterEndLuxon) {
                    const chunkStart = currentDayIter.toJSDate();
                    const chunkEnd = currentDayIter.endOf('day').toJSDate();
                    
                    expandedEvents.push({
                        ...event,
                        start: chunkStart,
                        end: chunkEnd,
                    });
                }
                currentDayIter = currentDayIter.plus({ days: 1 });
                
            }
        } else { // For single-day events or eventinfo display, adjust start/end to fit within the quarter
            let adjustedStart = luxonStart;
            let adjustedEnd = luxonEnd;

            // Adjust start date if it's before the quarter start
            if (adjustedStart < quarterStartLuxon) {
                adjustedStart = quarterStartLuxon;
            }
            // Adjust end date if it's after the quarter end
            if (adjustedEnd > quarterEndLuxon) {
                adjustedEnd = quarterEndLuxon;
            }

            expandedEvents.push({
                ...event,
                start: adjustedStart.toJSDate(),
                end: adjustedEnd.toJSDate(),
            });
        }
    });
    return expandedEvents;
}    

    const viewsOption = ["month", "week", "quarter","day", "agenda"] as const;

    const eventPropGetter = (event: CalEvent) => {
        const shouldApplyColor = 
            currentView === "week" || 
            (currentView === "month" && event.display === "eventinfo");

        return {
            style: {
                backgroundColor: shouldApplyColor ? event.backgroundColor : "transparent",
                color: shouldApplyColor ? event.fontColor : "black"
            }
        };
    };

    // formats 
    const formats = useMemo(() => ({
        // month view; 1 letter to represent day of the week in column headers 
        weekdayFormat: (date: Date) => DateTime.fromJSDate(date, { zone: stableZone }).toFormat("EEEEE"),

        // format for the number representing the day of the month for each cell in month view 
        dateFormat: (date: Date) => DateTime.fromJSDate(date, { zone: stableZone }).toFormat('d'),

        timeGutterFormat: (date: Date) => DateTime.fromJSDate(date, { zone: stableZone }).toFormat("HH:mm"), 
    }), [stableZone, locale]);

    // get the selected dates list 
    const selectedDates = (props.datesSelected?.items ?? [])
        .map(item => {
            const value = props.selectedDateAttr?.get(item)?.value;
            return value ? DateTime.fromJSDate(value, { zone: stableZone }).startOf('day').toJSDate() : null;
        })
        .filter((date): date is Date => !!date);

    // get the flags  
    const flagList = props.flags?.items ?? [];
    // Build a map of name and day 
    const flagMap = new Map<string, string>();
    for (const item of flagList) {
        const date = props.flagDateAttribute?.get(item)?.value;
        const name = props.flagNameAttribute?.get(item)?.value;
        if (date && name) {
           const dayKey = DateTime.fromJSDate(date, { zone: stableZone }).toISODate()!;
           flagMap.set(dayKey, name ?? "default-flag");
        }
    }

    // header for the week view 
    const CustomWeekHeader = ({ date }: { date: Date }) => {

        const cellDate = DateTime.fromJSDate(date, { zone: stableZone }).startOf('day');

        // Convert back to JS Date for compatibility with date-fns and isInQuarter
        const cellJsDate = cellDate.toJSDate();

        if (!isInQuarter(cellJsDate)) {
            return null; // Hide header for days outside the quarter
        }
        const dayLetter = cellDate.toFormat('EEEEE'); 
        const dayNumber = cellDate.toFormat('d'); 

        // Get the current time, interpret it in the selected zone, and set to start of day
        const today = DateTime.now().setZone(stableZone).startOf('day');

        const isToday = cellDate.toMillis() === today.toMillis();

        const dayKey = cellJsDate.toDateString();
        const flagClass = flagMap.get(dayKey);

        const className = [
            "custom-week-header",
            flagClass,
            isToday ? "rbc-today" : ""
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div tabIndex={0} className={className}>
                <span>
                    <div className="custom-week-header-letter">{dayLetter}</div>
                    <div className="custom-week-header-number">{dayNumber}</div>
                </span>
            </div>
        );
    };

    // for the month view only 
    const CustomMonthDateHeader = ({ label, date }: { label: string, date: Date }) => {

        const cellDate = DateTime.fromJSDate(date, { zone: stableZone }).startOf('day');
        const cellISO = cellDate.toISODate();

        if (!isInQuarter(date)) {
            return null; // Ensure isInQuarter can handle JS Date or update it to handle Luxon
        }

        // The current time, interpreted in the selected zone, then set to start of day
        const today = DateTime.now().setZone(stableZone).startOf('day');
        const todayISO = today.toISODate();
        
        const isToday = cellISO === todayISO;
        const isPast = cellDate < today; 
        
        // Comparison for Selected dates (need to ensure selectedDates are also normalized)
        const isSelected = selectedDates.some(d => {
            return DateTime.fromJSDate(d, { zone: stableZone }).toISODate() === cellISO;
        });

        const flagClass = flagMap.get(cellISO!);

        const className = [
            "rbc-date-cell",
            flagClass,
            isSelected ? "selected" : "",
            isPast ? "rbc-day-dimmed" : ""
        ]
            .filter(Boolean)
            .join(" ");

        let tabIndex: number | -1;
        if (isDatePicker === 'False') {
            tabIndex = 0;
        } else if (!isPast || isToday) {
            tabIndex = 0;
        } else {
            tabIndex = -1;
        }

        return (
            <div className={className} tabIndex={tabIndex}>
                {isToday ? (
                    <span className="month-today-inner">{label}</span>
                ) : (
                    label
                )}
            </div>
        );
    };

    const DateCellWrapper = (props: any) => {
        const { children, value } = props; 

        if (value && !isInQuarter(value)) {
            return <div style={{ visibility: "hidden", height: "100%" }}>{children}</div>;
        }

        return children;
    };


    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        const zonedStart = DateTime.fromJSDate(slotInfo.start, { zone: stableZone });
        // Ignore clicks outside quarter
        if (!isInQuarter(zonedStart.toJSDate())) return;

        const cleanDate = zonedStart.startOf('day').toJSDate();
        // const cleanDate = new Date(zonedStart.year, zonedStart.month - 1, zonedStart.day);

        // Set clicked date attribute in Mendix 
        if (props.clickedDate && props.clickedDate.setValue) {
            props.clickedDate.setValue(cleanDate); 
        }

        // Execute the onClickEmpty action
        if (props.onClickEmpty && props.onClickEmpty.canExecute) {
            props.onClickEmpty.execute();
        }
    };

    // messages  
    const messages = useMemo(() => ({
        showMore: (total: number) => `+${total}`
    }), []);

    function onShowMore(_events: CalEvent[], date: Date): false {
        handleSelectSlot({ start: date, end: date });
        return false;
    }

    useEffect(() => {
        const handler = (e: any) => {
            const date = e.detail?.date;
            if (!date) return;
            onShowMore([], date);
        };

        window.addEventListener("customShowMore", handler);
        return () => window.removeEventListener("customShowMore", handler);
    }, []);

    const { localizer, getNow, scrollToTime, defaultDate } =
        useMemo(() => {
            // Mendix: 0=Sun, 1=Mon
            // Luxon: 7=Sun, 1=Mon
            let luxonFirstDayOfWeek = 7;

            if (weekStartInt !== undefined && weekStartInt !== null) {
                const val = Number(weekStartInt);
                if (!isNaN(val)) {
                    luxonFirstDayOfWeek = val === 0 ? 7 : val;
                }
            }

            const l = luxonLocalizer(DateTime, { firstDayOfWeek: luxonFirstDayOfWeek });
            const originalStartOf = l.startOf;

            l.startOf = (date: Date, unit: string, culture?: any) => {
                if (unit === 'week') {
                    const dtObj = DateTime.fromJSDate(date, { zone: stableZone });
                    const weekday = dtObj.weekday;
                    const diff = (weekday - luxonFirstDayOfWeek + 7) % 7;
                    return dtObj.minus({ days: diff }).startOf('day').toJSDate();
                }
                return originalStartOf(date, unit, culture);
            };

            return {
                defaultDate: getDate(defaultDateStr, DateTime),
                getNow: () => DateTime.now().setZone(stableZone).toJSDate(),
                localizer: l,
                // Scroll to 6am, the date does not matter here, just need a date with the time that you want
                scrollToTime: DateTime.now().setZone(stableZone).set({ hour: 6, minute: 0, second: 0, millisecond: 0 }).toJSDate()}
        }, [stableZone, locale, weekStartInt])

    // Events processing block that uses the timezone-synced data
    const finalEvents = useMemo(() => {
        // Guard against processing during the switch
        if (isProcessing) return []; 
        
        const expanded = expandMultiDayEvents(rawEvents, currentView, stableZone, quarterStartLuxon, quarterEndLuxon);
        return groupIconEventsByDay(expanded, currentView);
    }, [rawEvents, currentView, stableZone, isProcessing]);
  
    const components = useMemo(() => ({ 
            week: {
                header: CustomWeekHeader,
                event: CustomWeekEvent
            },
            dateHeader: CustomMonthDateHeader,
            month: {
                event: (calendarEventProps: { event: CalEvent }) => (
                <CustomMonthEvent
                    {...calendarEventProps}
                    onShowMoreClick={(date) => onShowMore([], date)}
                    stableZone={stableZone}     
                />
                )
            },
            agenda: {
                event: ({ event }: { event: CalEvent }) => {
                    const template = (props as any).agendaEventTemplate;
                    if (template && event.item) {
                        return template.get(event.item);
                    }
                    return <CustomWeekEvent event={event} />;
                }
            },
            dateCellWrapper: DateCellWrapper, 
    }), [stableZone, selectedDates, (props as any).agendaEventTemplate]);

    return (
        <div className={classnames(className)}>
            {isProcessing ? (
                <div className="calendar-loading-overlay">Loading Calendar...</div>
            ) : ( 
                <Calendar<CalEvent>
                    key={`${locale ?? "default"}-${weekStartInt ?? "default"}`}
                    localizer={localizer}
                    events={finalEvents}
                    getNow={getNow}
                    defaultDate={defaultDate}
                    culture={locale}
                    startAccessor={(event: CalEvent) => event.start}
                    endAccessor={(event: CalEvent) => event.end}
                    views={viewsOption}
                    allDayAccessor={(event: CalEvent) => event.allDay}
                    eventPropGetter={eventPropGetter}
                    components={components}
                    formats={formats}
                    toolbar={false}
                    view={currentView ?? props.defaultView}
                    date={props.dateExpression?.value ?? new Date()}
                    onView={(newView: "month" | "week" | "quarter" | "day" | "agenda") => {
                        props.viewAttribute?.setValue?.(newView);
                    }}
                    onNavigate={(newDate: Date) => {
                        if ("setValue" in (props.dateExpression ?? {})) {
                            // @ts-expect-error: setValue may exist on runtime Mendix object
                            props.dateExpression.setValue(newDate);
                        }
                    }}
                    selectable={true}
                    onSelectSlot={handleSelectSlot} // clicking on calendar 
                    showMultiDayTimes={true}
                    // timeslots={1} // number of slots per "section" in the time grid views
                    // step={4} // selectable time increments 
                    messages={messages}
                    onShowMore={onShowMore}
                    popup={false}
                    drilldownView={null}
                    dayLayoutAlgorithm="no-overlap"
                    // Set agenda length: 1 for 'day' view (as agenda), 7 for the standard 'agenda' view.
                    length={rawView === 'day' ? 1 : 7}
                    scrollToTime={scrollToTime}  
                    // longPressThreshold={120} // default is 250ms
                />
            )}
        </div>
    );
}
