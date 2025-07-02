// main entry point for the widget; all props will come in from here.
import classnames from "classnames";
import { ReactElement, createElement, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarContainerProps } from "../typings/CalendarProps";
import { constructWrapperStyle } from "./utils/utils";
import { format, startOfWeek } from 'date-fns';  
import * as dateFns from "date-fns";

// Event content is customized based on icons or eventInfo and allDay or timed events and week or month view 
const CustomWeekEvent = ({ event }: { event: CalEvent }) => {
     const { title, start, allDay } = event;
    return allDay ? (
        <div className="allDay-event">
            <strong>{title}</strong>
        </div>
    ) : (
        <div className="timed-event">
            <p>{start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })}</p>
            <strong>{title}</strong>
        </div>
    );
};

interface CustomMonthEventProps {
    event: CalEvent & { icons?: string[] };
    onShowMoreClick?: (date: Date) => void;
}

const CustomMonthEvent = ({ event, onShowMoreClick }: CustomMonthEventProps) => {
    if (event.filter === "icons" && event.icons && event.icons.length > 0) {
        const maxToShow = 3;
        const visible = event.icons.slice(0, maxToShow);
        const hiddenCount = event.icons.length - visible.length;

        return (
            <div className="icon-row">
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

    if (event.filter === "eventinfo") {
        return (
            <div className="event-info">
                <strong>{event.title}</strong>
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
        if (event.filter === "eventinfo") {
            // Keep regular event info events ungrouped
            result.push(event);
            continue;
        }

        if (event.filter === "icons") {
            const dayKey = event.start.toDateString();

            if (!groupedMap.has(dayKey)) {
                groupedMap.set(dayKey, {
                    ...event,
                    filter: "icons",
                    iconName: "",         // suppress single icon
                    title: "",            // suppress title
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
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    filter: string;
    iconName: string;
    // optional: 
    icons?: string[];
    location?: string; 
    fontColor?: string;
    backgroundColor?: string;
}

// icons need to show on each day of a multiday event 
function expandMultiDayEvents(events: CalEvent[], view: string): CalEvent[] {
    const expandedEvents: CalEvent[] = [];
    
    events.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        const isMultiDay = startDate.toDateString() !== endDate.toDateString();
        const shouldChunk = event.filter === "icons" && view === "month";

        // chunk events that are more than 1 day when filter is icons
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
            // if single-day events or if filter is EventInfo then don't chunk  
            expandedEvents.push(event);
        }
    });

    return expandedEvents;
}


export default function MxCalendar(props: CalendarContainerProps): ReactElement {
    const { class: className } = props;

    const currentView = props.viewAttribute?.value as typeof props.defaultView;

    const wrapperStyle = constructWrapperStyle(props);

    const items = props.databaseDataSource?.items ?? [];

    const rawEvents: CalEvent[] = items.map(item => {
        const title =
            props.titleType === "attribute" && props.titleAttribute
                ? (props.titleAttribute.get(item).value ?? "")
                : props.titleType === "expression" && props.titleExpression
                  ? (props.titleExpression.get(item).value ?? "")
                  : "Untitled Event";

        const start = props.startAttribute?.get(item).value ?? new Date();
        const end = props.endAttribute?.get(item).value ?? start;
        const allDay = props.allDayAttribute?.get(item).value ?? false;
        const fontColor = props.eventFontColor?.get(item).value;
        const backgroundColor = props.eventBackgroundColor?.get(item).value;
        const location = props.locationAttribute?.get(item).value ?? "";
        const iconName = props.iconAttribute?.get(item).value ?? "";
        const rawFilter = props.filterType?.get(item)?.value;
        const filter = rawFilter ? rawFilter.toString().toLowerCase() : "";

        return { title, start, end, fontColor, backgroundColor, allDay, location, filter, iconName }; 
    });

    const expanded = expandMultiDayEvents(rawEvents, currentView);
    const events = groupIconEventsByDay(expanded, currentView);


    const viewsOption: Array<"month" | "week" | "work_week" | "day" | "agenda"> =
        props.view === "standard" ? ["week", "month", "day"] : ["month", "week", "work_week", "day", "agenda"]; 

    const eventPropGetter = (event: CalEvent) => {
        const shouldApplyBackground = currentView === "week" || (currentView === "month" && event.filter === "eventinfo");

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

    function onShowMore(events: CalEvent[], _date: Date): false  { // date is unused so use underscore to remove error that its not being used 
        
        if (events.length > 0 && props.clickedDate?.setValue) {
            props.clickedDate.setValue(events[0].start);
        }

        if (props.onClickShowMore?.canExecute) {
            props.onClickShowMore.execute();
        }

        // Switch to 'month' view explicitly (so that it doesn't go to day view)
        if (props.viewAttribute?.setValue) {
            props.viewAttribute.setValue("month");
        }

        // Prevent default navigation to day view
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
                onView={(newView: "month" | "week" | "day") => {
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
            />
        </div>
    );
}


