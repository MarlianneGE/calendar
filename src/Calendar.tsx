// main entry point for the widget; all props will come in from here.
import classnames from "classnames";
import { ReactElement, createElement, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarContainerProps } from "../typings/CalendarProps";
import { constructWrapperStyle } from "./utils/utils";
import { format, startOfWeek } from 'date-fns';  
import * as dateFns from "date-fns";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse,
    faHeartPulse,
    faTrophy,
    faClock,
    faPlane
} from "@fortawesome/free-solid-svg-icons";

// Event content is customized based on icons or eventInfo and allDay or timed events and week or month view 
const CustomWeekEvent = ({ event }: { event: CalEvent }) => {
     const { title, location, start, end, allDay } = event;
    return allDay ? (
        <div className="allDay-event">
            <strong>{title}</strong>
            <p>{location}</p>
        </div>
    ) : (
        <div className="timed-event">
            <strong>{title}</strong>
            <p>
                {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })} -{" "}
                {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })}
            </p>
        </div>
    );
};
const CustomMonthEvent = ({ event }: { event: CalEvent }) => {
    const { iconName, title, filter, } = event; //title, location, start, end, allDay, filter, 

    const iconMap: { [key: string]: any } = {
        "house": faHouse,
        "heart-pulse": faHeartPulse,
        "trophy": faTrophy,
        "clock": faClock,
        "plane": faPlane
    };

    // show icon  
    const renderIcon = () => {
        const icon = iconMap[iconName];

        return icon ? (
            <span className="custom-icon">
                <FontAwesomeIcon icon={icon} />
            </span>
        ) : renderInfo(); // fallback to event info if icon isn't found
    };

    // show event info 
    const renderInfo = () => {
        return (
            <div>
                <strong>{title}</strong>
            </div>
        ) 
    };

    return filter === "icons" ? renderIcon() : renderInfo(); //filter === "icons" ? renderIcon() :
};

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
    type: string;
    filter: string;
    iconName: string;
    // optional: 
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
        const type = props.eventTypeAttribute?.get(item).value ?? "";
        const iconName = props.iconAttribute?.get(item).value ?? "";
        const rawFilter = props.filterType?.get(item)?.value;
        const filter = rawFilter ? rawFilter.toString().toLowerCase() : "";

        return { title, start, end, fontColor, backgroundColor, allDay, location, type, filter, iconName }; 
    });

    const events = expandMultiDayEvents(rawEvents, currentView);

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

        // Switch to 'month' view explicitly
        if (props.viewAttribute?.setValue) {
            props.viewAttribute.setValue("month");
        }

        // Prevent default navigation to day view
        return false;
    }
  
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
                        event: CustomMonthEvent
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


