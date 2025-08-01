// main entry point for the widget; all props will come in from here.
import classnames from "classnames";
import { ReactElement, createElement, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarContainerProps } from "../typings/CalendarProps";
import { constructWrapperStyle } from "./utils/utils";
import { format, startOfWeek } from 'date-fns';  
import * as dateFns from "date-fns";


const CustomWeekEvent = ({ event }: { event: CalEvent }) => {
     const { text1, allDay, text2 } = event;
    return allDay ? (
        <div className={`allDay-event`}>
            <p>{text1}</p>
            <strong>{text2}</strong>
        </div>
    ) : (
        <div className={`timed-event`}>
            <p>{text1}</p>
            <strong>{text2}</strong>
        </div>
    );
};

interface CustomMonthEventProps {
    event: CalEvent & { icons?: string[] };
    onShowMoreClick?: (date: Date) => void;

}

// Event content is customized based on icons or eventInfo display  
const CustomMonthEvent = ({ event, onShowMoreClick }: CustomMonthEventProps) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = event.end < today;
    const dimClass = isPast ? "rbc-day-dimmed" : "";
    if (event.display === "icons" && event.icons && event.icons.length > 0) {
        const maxToShow = 3;
        const visible = event.icons.slice(0, maxToShow);
        const hiddenCount = event.icons.length - visible.length;

        return (
            <div className={`icon-row ${dimClass}`}>
                <div className="circle-row">
                    {visible.map((color, i) => (
                        <span
                            key={i}
                            className="color-circle"
                            style={{ backgroundColor: color }}
                            title={color}
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
            <div className={`event-info ${dimClass}`}>
                <p>{event.text1}</p>
                <strong>{event.text2}</strong>
            </div>
        );
    }

    return null;
};



function groupIconEventsByDay(events: CalEvent[], view: string): CalEvent[] {
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
            const dayKey = event.start.toDateString();

            if (!groupedMap.has(dayKey)) {
                groupedMap.set(dayKey, {
                    ...event,
                    display: "icons",
                    text2: "",            // suppress text2
                    icons: [event.fontColor || "#999"], // custom field for grouped icons
                });
            } else {
                const grouped = groupedMap.get(dayKey)!;
                (grouped.icons ||= []).push(event.fontColor || "#999");
            }
        }
    }

    return [...result, ...groupedMap.values()];
}



const localizer = dateFnsLocalizer({
    format: dateFns.format,
    parse: dateFns.parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // make week view start on monday instead of sunday 
    getDay: dateFns.getDay,
    locales: {}
});

interface CalEvent {
    text2: string;
    start: Date;
    end: Date;
    allDay: boolean;
    display: string;
    // optional: 
    icons?: string[];
    fontColor?: string;
    backgroundColor?: string;
    text1?: string;
    type?: string;
}

// icons need to show on each day of a multiday event 
function expandMultiDayEvents(events: CalEvent[], view: string): CalEvent[] {
    const expandedEvents: CalEvent[] = [];
    
    events.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        const isMultiDay = startDate.toDateString() !== endDate.toDateString();
        const shouldChunk = event.display === "icons" && view === "month";

        // chunk events that are more than 1 day when display is icons
        if (isMultiDay && shouldChunk) {
            let currentDate = new Date(startDate);

            while (currentDate < endDate) {
                const chunkStart = new Date(currentDate);
                chunkStart.setHours(0, 0, 0, 0); // time doesn't matter since multi-day events are shown in all day section and this will not change the displayed time 

                const chunkEnd = new Date(currentDate);
                chunkEnd.setHours(23, 59, 59, 999); // time doesn't matter since multi-day events are shown in all day section and this will not change the displayed time 

                expandedEvents.push({
                    ...event,
                    start: chunkStart,
                    end: chunkEnd,
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            // if single-day events or if display is EventInfo then don't chunk  
            expandedEvents.push(event);
        }
    });

    return expandedEvents;
}


export default function MxCalendar(props: CalendarContainerProps): ReactElement {
    const { class: className } = props;

    // currentView will be "month" if "quarter" is selected 
    const rawView = props.viewAttribute?.value ?? props.defaultView;
    const currentView = rawView === "quarter" ? "month" : rawView;

    const wrapperStyle = constructWrapperStyle(props);

    const items = props.databaseDataSource?.items ?? [];

    const rawEvents: CalEvent[] = items.map(item => {
        const text1 =
            props.text1 === "attribute" && props.text1Attribute
                ? (props.text1Attribute.get(item).value ?? "")
                : props.text1 === "expression" && props.text1Expression
                  ? (props.text1Expression.get(item).value ?? "")
                  : "";

        const text2 =
            props.text2 === "attribute" && props.text2Attribute
                ? (props.text2Attribute.get(item).value ?? "")
                : props.text2 === "expression" && props.text2Expression
                  ? (props.text2Expression.get(item).value ?? "")
                  : "";

        const start = props.startAttribute?.get(item).value ?? new Date();
        const end = props.endAttribute?.get(item).value ?? start;
        const allDay = props.allDayAttribute?.get(item).value ?? false;
        const fontColor = props.eventFontColor?.get(item).value;
        const backgroundColor = props.eventBackgroundColor?.get(item).value;
        const rawdisplay = props.displayType?.value;
        const display = rawdisplay ? rawdisplay.toString().toLowerCase() : "";
        const type = props.eventTypeAttribute?.get(item)?.value ?? "";

        return { text2, start, end, fontColor, backgroundColor, allDay, display, text1, type }; 
    });

    const expanded = expandMultiDayEvents(rawEvents, currentView);
    const events = groupIconEventsByDay(expanded, currentView);

    const viewsOption = ["month", "week", "quarter"] as const;

    const eventPropGetter = (event: CalEvent) => {
        const shouldApplyBackground = currentView === "week" || (currentView === "month" && event.display === "eventinfo");

        return {
            style: {
                backgroundColor: shouldApplyBackground ? event.backgroundColor : "transparent",
                color: event.fontColor
            }
        };
    };

    // formats 
    const formats = useMemo(() => ({

        // month view; 1 letter to represent day of the week in column headers 
        weekdayFormat: (
            date: Date,
            culture: string | undefined,
            localizer: ReturnType<typeof dateFnsLocalizer>
        ) => localizer.format(date, "EEEEE", culture),

        // format for the number representing the day of the month for each cell in month view 
        dateFormat: (
            date: Date,
            culture: string | undefined,
            localizer: ReturnType<typeof dateFnsLocalizer>
        ) => localizer.format(date, 'd', culture),

        timeGutterFormat: (
            date: Date,
            culture: string | undefined,
            localizer: ReturnType<typeof dateFnsLocalizer>
        ) => localizer.format(date, "HH:mm", culture), // 24-hour format, no AM/PM 
 
    }), []);

    // header for the week view 
    const CustomWeekHeader = ({ date }: { date: Date }) => {
        const dayLetter = format(date, 'EEEEE'); // first letter of the weekday, ie. "M"
        const dayNumber = format(date, 'd');     // day of the month, ie. "3"
        return (
            <div className="custom-week-header">
                <div className="custom-week-header-letter">{dayLetter}</div>
                <div className="custom-week-header-number">{dayNumber}</div>
            </div>
        );
    };

    // get the selected dates list 
    const selectedDates = useMemo(() => {
        const items = props.datesSelected?.items ?? [];
        if (items.length === 0) return [];
        return items.map(item => {
            const value = props.selectedDateAttr?.get(item)?.value;
            return value ? new Date(value.setHours(0, 0, 0, 0)) : null;
        }).filter((date): date is Date => !!date);
    }, [props.datesSelected?.items]);

    // for the month view only 
    const CustomMonthDateHeader = ({ label, date, ungroupedEvents }: { label: string, date: Date, ungroupedEvents: CalEvent[] }) => {
        const isToday = new Date().toDateString() === date.toDateString();

        const hasTimeslot = ungroupedEvents.some(
            event =>
                event.type === "Timeslot" &&
                new Date(event.start).toDateString() === date.toDateString()
        );

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        const isSelected = selectedDates.some(
            selected => selected.getTime() === normalizedDate.getTime()
        );
        const isPast = normalizedDate < new Date(new Date().setHours(0,0,0,0));

        const className = [
            "rbc-date-cell",
            !hasTimeslot ? "no-timeslot-cell" : "",
            isToday ? "rbc-now" : "",
            isSelected ? "selected" : "",
            isPast ? "rbc-day-dimmed" : ""
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div className={className}>
                {isToday ? (
                    <span className="today-inner">{label}</span>
                ) : (
                    label
                )}
            </div>
        );
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        // Set clicked date attribute in Mendix 
        if (props.clickedDate && props.clickedDate.setValue) {
            props.clickedDate.setValue(slotInfo.start); 
        }

        // Execute the onClickEmpty action
        if (props.onClickEmpty && props.onClickEmpty.canExecute) {
            props.onClickEmpty.execute();
        }
    };

    const handleSelectEvent = (event: CalEvent) => {
        // Set clicked date attribute in Mendix
        if (props.clickedDate && props.clickedDate.setValue) {
            props.clickedDate.setValue(event.start); 
        }

        // Execute the onClickEvent action
        if (props.onClickEvent && props.onClickEvent.canExecute) {
            props.onClickEvent.execute();
        }
    };

    // messages  
    const messages = useMemo(() => ({
        showMore: (total: number) => `+${total}`
    }), []);

    function onShowMore(_events: CalEvent[], date: Date): false {
    if (props.clickedDate?.setValue) {
        props.clickedDate.setValue(date);
    }

    if (props.onClickShowMore?.canExecute) {
        props.onClickShowMore.execute();
    }

    if (props.viewAttribute?.setValue) {
        props.viewAttribute.setValue("month");
    }

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

  
    return (
        <div className={classnames(className)} style={wrapperStyle}>
            <Calendar<CalEvent>
                localizer={localizer}
                events={events}
                startAccessor={(event: CalEvent) => event.start}
                endAccessor={(event: CalEvent) => event.end}
                views={viewsOption}
                allDayAccessor={(event: CalEvent) => event.allDay}
                eventPropGetter={eventPropGetter}
                components={{
                    week: {
                        header: CustomWeekHeader,
                        event: CustomWeekEvent
                    },
                    dateHeader: ({ label, date }: { label: string, date: Date }) => (
                        <CustomMonthDateHeader
                            label={label}
                            date={date}
                            ungroupedEvents={expanded}
                        />
                    ),
                    month: {
                        event: (calendarEventProps: { event: CalEvent }) => (
                        <CustomMonthEvent
                            {...calendarEventProps}
                            onShowMoreClick={(date) => onShowMore([], date)}     
                        />
                        )
                    },
                }}
                formats={formats}
                toolbar={false}
                view={currentView ?? props.defaultView}
                date={props.dateAttribute?.value ?? new Date()}
                onView={(newView: "month" | "week" | "quarter") => {
                    props.viewAttribute?.setValue?.(newView);
                }}
                onNavigate={(newDate: Date) => {
                    props.dateAttribute?.setValue?.(newDate);
                }}
                selectable={true}
                onSelectSlot={handleSelectSlot} // empty space on calendar 
                onSelectEvent={handleSelectEvent}
                showMultiDayTimes={true}
                // timeslots={1} // number of slots per "section" in the time grid views
                // step={4} // selectable time increments 
                messages={messages}
                onShowMore={onShowMore}
                popup={false}
                drilldownView={null}
                scrollToTime={new Date(1970, 1, 1, 6, 0, 0)} // Scroll to 6am, the date does not matter here, just need a date with the time that you want 
            />
        </div>
    );
}


