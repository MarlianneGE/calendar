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


// Event content is customized based on event type 
// const CustomEvent = ({ event }: { event: CalEvent }) => {
//   const { type, title, location, start, end, to, reservation } = event;

//   const renderByType = () => {
//     switch (type) {
//       case 'competition':
//         return (
//           <div className="competition-event">
//             <strong>{title}</strong>
//           </div>
//         );
//       case 'overnight':
//         return (
//           <div className="overnight-event">
//             <strong>{title}</strong>
//             <p>{location}</p>
//           </div>
//         );
//       case 'activity':
//         return (
//           <div className="activity-event">
//             <strong>{title}</strong>
//             <p>
//             {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })} - 
//             {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
//             </p>
//           </div>
//         );
//       case 'timeslot':
//         return (
//           <div className="timeslot-event">
//             <strong>{title}</strong>
//             <p>{start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}</p>
//           </div>
//         );
//       case 'transit':
//         return (
//           <div className="transit-event">
//             <strong>{reservation} {title} from {location} to {to}</strong>
//           </div>
//         );
//       default:
//         return (
//           <div className="default-event">
//             <strong>{title}</strong>
//             <p>{location}</p>
//             <p> {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })} - 
//             {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}</p>
//           </div>
//         );
//     }
//   };

//   return renderByType();
// };
// const CustomEvent = ({ event }: { event: CalEvent }) => {
//   const { title, location, start, end, allDay } = event;                  // add filter attribute here and add logic below for icons 

//   const renderByType = () => {
//     switch (allDay) {
//       case true:
//         return (
//           <div className="overnight-event">
//             <strong>{title}</strong>
//             <p>{location}</p>
//           </div>
//         );
//       default:
//         return (
//           <div className="default-event">
//             <strong>{title}</strong>
//             <p> {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })} - 
//             {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}</p>
//           </div>
//         );
//     }
//   };

//   return renderByType();
// };
const CustomEvent = ({ event }: { event: CalEvent }) => {
    const { title, location, start, end, allDay, filter, iconName } = event;

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
        return allDay ? (
            <div className="overnight-event">
                <strong>{title}</strong>
                <p>{location}</p>
            </div>
        ) : (
            <div className="default-event">
                <strong>{title}</strong>
                <p>
                    {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })} -{" "}
                    {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })}
                </p>
            </div>
        );
    };

    return filter === "icons" ? renderIcon() : renderInfo();
};


// make week view start on monday instead of sunday 
const localizer = dateFnsLocalizer({
    format: dateFns.format,
    parse: dateFns.parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), 
    getDay: dateFns.getDay,
    locales: {}
});



interface CalEvent {
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: string;
    filter: "icons" | "eventInfo";
    iconName: string;
    // optional: 
    location?: string; 
    fontColor?: string;
    backgroundColor?: string;
}

export default function MxCalendar(props: CalendarContainerProps): ReactElement {
    const { class: className } = props;
    const wrapperStyle = constructWrapperStyle(props);

    const items = props.databaseDataSource?.items ?? [];

    const events: CalEvent[] = items.map(item => {
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
        const filter = props.filterType === "icons" ? "icons" : "eventInfo";

        return { title, start, end, fontColor, backgroundColor, allDay, location, type, filter, iconName }; 
    });

    const viewsOption: Array<"month" | "week" | "work_week" | "day" | "agenda"> =
        props.view === "standard" ? ["week", "month"] : ["month", "week", "work_week", "day", "agenda"]; 


    const eventPropGetter = (event: CalEvent) => {
        return {
            style: {
                backgroundColor: event.filter === "eventInfo" ? event.backgroundColor : "transparent",
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

        // format for the title in week view 
        dayRangeHeaderFormat: (
            range: { start: Date; end: Date },
            culture: string | undefined,
            localizer: ReturnType<typeof dateFnsLocalizer>
        ) => {
            const { start, end } = range;

            const sameMonth = start.getMonth() === end.getMonth();
            const sameYear = start.getFullYear() === end.getFullYear();

            if (sameMonth && sameYear) {
                return (
                    localizer.format(start, "MMMM d", culture) +
                    " – " +
                    localizer.format(end, "d, yyyy", culture)
                );
            } else if (sameYear) {
                return (
                    localizer.format(start, "MMMM d", culture) +
                    " – " +
                    localizer.format(end, "MMMM d, yyyy", culture)
                );
            } else {
                return (
                    localizer.format(start, "MMMM d, yyyy", culture) +
                    " – " +
                    localizer.format(end, "MMMM d, yyyy", culture)
                );
            }
        }

 
    }), []);

    // messages  
    const messages = useMemo(() => ({
        previous: '‹', // or can use '\u2039'
        next: '›' 
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

    // const min = useMemo(() => {
    //     if (events.length === 0) return new Date(1970, 0, 1, 8, 0);
    //     const hours = events.map(e => e.start.getHours());
    //     const earliest = Math.max(Math.min(...hours) - 1, 0);
    //     console.log("Min time:", earliest.toString());
    //     return new Date(1970, 0, 1, earliest, 0);
    // }, [events]);

    // const max = useMemo(() => {
    //     if (events.length === 0) return new Date(1970, 0, 1, 18, 0);
    //     const hours = events.map(e => e.end.getHours());
    //     const latest = Math.min(Math.max(...hours) + 1, 23);
    //     return new Date(1970, 0, 1, latest, 0);
    // }, [events]);


    return (
        <div className={classnames(className)} style={wrapperStyle}>
            <Calendar<CalEvent>
                localizer={localizer}
                events={events}
                defaultView={props.defaultView}
                startAccessor={(event: CalEvent) => event.start}
                endAccessor={(event: CalEvent) => event.end}
                views={viewsOption}
                allDayAccessor={(event: CalEvent) => event.allDay}
                eventPropGetter={eventPropGetter}
                components={{
                    event: CustomEvent, 
                    week: {
                        header: CustomWeekHeader 
                    }
                }}
                formats={formats}
                showAllEvents={true}
                messages={messages}
                step={60}// show 1-hour slots
                timeslots={1} // number of subdivisions per step
                // min={min} // start hour for week view 
                // max={max} // end hour for week view
                dayLayoutAlgorithm="no-overlap"
            />
        </div>
    );
}

