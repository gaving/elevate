import * as _ from "lodash";
import $ from "../../modules/jquery.appear";
import { Helper } from "../helper";
import { UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "../models/app-resources.model";
import { AbstractModifier } from "./abstract.modifier";

export interface EffortInfo {
    // values obtained from the HTTP request
    id: number; // segment effort id
    activity_id: number;
    segment_id: number;

    elapsed_time_raw: number;
    avg_watts: number;
    avg_heart_rate: number;

    start_date_local: Date;
    start_date_local_raw: string;
    rank: number;

    hazard_segment: boolean;
    overall_rank: string;
    overall_count: string;

    qom_time: string;
    kom_time: string;

    __dateTime: Date; // field added by us: start_date_local_raw converted into machine readable format (how is this different from start_date_local?)
}

export interface LeaderBoardData {
    top_results: EffortInfo[];
    viewer_rank: number;
}

export class ActivitySegmentTimeComparisonModifier extends AbstractModifier {
    protected showDifferenceToKOM: boolean;
    protected showDifferenceToPR: boolean;
    protected showDifferenceToCurrentYearPR: boolean;
    protected displaySegmentTimeComparisonPosition: boolean;
    protected appResources: AppResourcesModel;
    protected isBike: boolean;
    protected isFemale: boolean;
    protected firstAppearDone: boolean;
    protected deltaYearPRLabel: string;
    protected deltaPRLabel: string;
    protected deltaKomLabel: string;

    constructor(
        userSettings: UserSettingsModel,
        appResources: AppResourcesModel,
        activityType: string,
        isMyOwn: boolean
    ) {
        super();
        this.showDifferenceToKOM =
            userSettings.displaySegmentTimeComparisonToKOM;
        this.showDifferenceToPR =
            isMyOwn && userSettings.displaySegmentTimeComparisonToPR;
        this.showDifferenceToCurrentYearPR =
            isMyOwn && userSettings.displaySegmentTimeComparisonToCurrentYearPR;
        this.displaySegmentTimeComparisonPosition =
            userSettings.displaySegmentTimeComparisonPosition;
        this.appResources = appResources;
        this.isBike = activityType === "Ride";
    }

    protected crTitle(): string {
        return this.isBike ? (this.isFemale ? "QOM" : "KOM") : "CR";
    }

    public modify(): void {
        if (
            !this.showDifferenceToKOM &&
            !this.showDifferenceToPR &&
            !this.showDifferenceToCurrentYearPR &&
            !this.displaySegmentTimeComparisonPosition
        ) {
            return;
        }

        // wait for Segments section load
        const segments: JQuery = $("#segments");
        if (segments.length === 0) {
            setTimeout(() => {
                this.modify();
            }, 500);
            return;
        }

        segments.find("#segment-filter").show();
        segments.addClass("time-comparison-enabled");

        // Find sex of current activity athlete
        this.findOutGender();

        // Asign new labels values
        this.setNewLabelsValues();

        // Used to update header with new columns names when first item has appear
        this.firstAppearDone = false;

        $("tr[data-segment-effort-id]")
            .appear()
            .on("appear", (event: Event, $items: any) => {
                if (!this.firstAppearDone) {
                    let timeColumnHeader = segments.find(
                        "table.segments th.time-col"
                    );

                    if (timeColumnHeader.length == 0) {
                        // activities other than cycling (like nordic ski) miss time-col class, search by text
                        timeColumnHeader = segments.find(
                            "table.segments th:contains('Time')"
                        );
                    }

                    if (true) {

                        let headerType = this.isBike ? "Dynamo" : "Dawdler";
                        timeColumnHeader.after(
                            "<th style='font-size:10px;' title='My Dalmarnock leaderboard position'>My " +  headerType + " Position</th>"
                        );
                    }

                    if (
                        this.showDifferenceToPR &&
                        this.showDifferenceToCurrentYearPR
                    ) {
                        timeColumnHeader.after(
                            "<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your current year PR on that segment.'>" +
                                this.deltaYearPRLabel +
                                "</th>"
                        );
                    }

                    if (this.showDifferenceToPR) {
                        timeColumnHeader.after(
                            "<th style='font-size:11px;' title='Column shows the difference between the activity segment time and your previous PR on that segment.'>" +
                                this.deltaPRLabel +
                                "</th>"
                        );
                    }

                    if (this.showDifferenceToKOM) {
                        timeColumnHeader.after(
                            "<th style='font-size:11px;' title='Column shows the difference between the current " +
                                this.crTitle() +
                                " time and the activity segment time.'>" +
                                this.deltaKomLabel +
                                "</th>"
                        );
                    }

                    if (this.displaySegmentTimeComparisonPosition) {
                        timeColumnHeader.after(
                            "<th title='Column shows your current position on that segment.'>Rank</th>"
                        );
                    }

                    this.firstAppearDone = true;
                }

                $items.each(() => {
                    let $row = $(event.currentTarget),
                        $timeCell = $row.find("td.time-col"),
                        segmentEffortId: number = $row.data(
                            "segment-effort-id"
                        ),
                        segmentEffortInfoUrl: string =
                            "/segment_efforts/" + segmentEffortId,
                        positionCell: JQuery,
                        leaderboardCell: JQuery,
                        deltaKomCell: JQuery,
                        deltaPRCell: JQuery,
                        deltaYearPRCell: JQuery;

                    if (
                        $row.hasClass("selected") ||
                        $row.data("segment-time-comparison")
                    ) {
                        return;
                    }

                    $row.data("segment-time-comparison", true);

                    if (true) {
                        leaderboardCell = $(
                            "<td><span class='ajax-loading-image'></span></td>"
                        );
                        $timeCell.after(leaderboardCell);
                    }

                    if (
                        this.showDifferenceToPR &&
                        this.showDifferenceToCurrentYearPR
                    ) {
                        deltaYearPRCell = $(
                            "<td><span class='ajax-loading-image'></span></td>"
                        );
                        $timeCell.after(deltaYearPRCell);
                    }

                    if (this.showDifferenceToPR) {
                        deltaPRCell = $(
                            "<td><span class='ajax-loading-image'></span></td>"
                        );
                        $timeCell.after(deltaPRCell);
                    }

                    if (this.showDifferenceToKOM) {
                        deltaKomCell = $(
                            "<td><span class='ajax-loading-image'></span></td>"
                        );
                        $timeCell.after(deltaKomCell);
                    }

                    if (this.displaySegmentTimeComparisonPosition) {
                        positionCell = $(
                            "<td><span class='ajax-loading-image'></span></td>"
                        );
                        $timeCell.after(positionCell);
                    }

                    // Retreive segment effort infos
                    $.getJSON(
                        segmentEffortInfoUrl,
                        (segmentEffortInfo: EffortInfo) => {
                            if (!segmentEffortInfo) {
                                return;
                            }

                            // If flagged segment then '-'
                            if (false) {
                                leaderboardCell.html("-");
                                positionCell.html("-");
                                deltaKomCell.html("-");
                                deltaPRCell.html("-");
                                deltaYearPRCell.html("-");
                                return;
                            }

                            if (true) {
                                leaderboardCell.html(
                                '<div title="nah" style="text-align: center; font-size:11px; padding: 1px 1px;">N/A</div>'
                                );
                            } else {
                                leaderboardCell.html("n/a");
                            }

                            if (
                                this.displaySegmentTimeComparisonPosition &&
                                segmentEffortInfo.overall_rank
                            ) {
                                const overallRank = segmentEffortInfo.overall_rank
                                    ? parseInt(segmentEffortInfo.overall_rank)
                                    : 0;
                                const percentRank: number =
                                    overallRank /
                                    parseInt(segmentEffortInfo.overall_count);
                                positionCell.html(
                                    '<div title="Your position" style="text-align: center; font-size:11px; padding: 1px 1px; background-color: #565656; color:' +
                                        this.getColorForPercentage(
                                            percentRank
                                        ) +
                                        '">' +
                                        overallRank +
                                        "&nbsp;/&nbsp;" +
                                        segmentEffortInfo.overall_count +
                                        "<br/>" +
                                        (percentRank * 100).toFixed(1) +
                                        "%</div>"
                                );
                            } else {
                                positionCell.html("n/a");
                            }

                            const komSeconds: string = Helper.HHMMSStoSeconds(
                                    (this.isFemale
                                        ? segmentEffortInfo.qom_time
                                        : segmentEffortInfo.kom_time
                                    ).replace(/[^0-9:]/gi, "")
                                ).toString(),
                                elapsedTime =
                                    segmentEffortInfo.elapsed_time_raw,
                                komDiffTime =
                                    elapsedTime - parseInt(komSeconds),
                                komPercentTime =
                                    (elapsedTime / parseInt(komSeconds) - 1) *
                                    100;

                            if (komSeconds == "NaN") {
                                deltaKomCell.html("N/A");
                            } else if (this.showDifferenceToKOM) {
                                const sign: string =
                                    Math.sign(komDiffTime) == 1 ? "+" : "-";
                                deltaKomCell.html(
                                    '<span title="Time difference with current ' +
                                        this.crTitle() +
                                        " (" +
                                        Helper.secondsToHHMMSS(
                                            Math.abs(parseInt(komSeconds)),
                                            true
                                        ) +
                                        ")\" style='font-size:11px; color:" +
                                        (komDiffTime > 0
                                            ? "#FF5555"
                                            : "#2EB92E") +
                                        ";'>" +
                                        sign +
                                        Helper.secondsToHHMMSS(
                                            Math.abs(komDiffTime),
                                            true
                                        ) +
                                        "<br/>" +
                                        (Math.sign(komPercentTime) == 1
                                            ? "+"
                                            : "") +
                                        komPercentTime.toFixed(1) +
                                        "%</span>"
                                );
                            }

                            this.findClubCurrentSegmentEffortDate(
                                segmentEffortInfo.segment_id,
                                segmentEffortId
                            ).then(
                                (
                                    leaderBoardData: LeaderBoardData
                                ) => {
            leaderboardCell.html(
                    "<span style='font-size:15px; border-radius: 30px; padding: 10px; color: #DDDDDD; background-color:" +
                                (leaderBoardData.viewer_rank > 1 ? "#FF4136" : "#3D9970") +
                                ";'>" +
                        (leaderBoardData.viewer_rank ? leaderBoardData.viewer_rank : "N/A") +
                        "</span>"
                );
                                }
                            );



                            if (
                                !this.showDifferenceToPR &&
                                !this.showDifferenceToCurrentYearPR
                            ) {
                                return;
                            }

                            // Get leader board from segment id
                            this.findCurrentSegmentEffortDate(
                                segmentEffortInfo.segment_id,
                                segmentEffortId
                            ).then(
                                (
                                    currentSegmentEffortDateTime: Date,
                                    leaderBoardData: EffortInfo[]
                                ) => {
                                    this.handleTimeDifferenceAlongUserLeaderBoard(
                                        leaderBoardData,
                                        currentSegmentEffortDateTime,
                                        elapsedTime,
                                        segmentEffortId,
                                        deltaPRCell,
                                        deltaYearPRCell
                                    );
                                }
                            );
                        }
                    );
                });
            });

        $.force_appear();

        // when a user clicks 'Analysis' #segments element is removed so we have to wait for it and re-run modifier function
        const waitForSegmentsSectionRemoved = () => {
            if ($("#segments.time-comparison-enabled").length !== 0) {
                setTimeout(() => {
                    waitForSegmentsSectionRemoved();
                }, 1000);
                return;
            }
            this.modify();
        };
        waitForSegmentsSectionRemoved();
    }

    protected findOutGender(): void {
        this.isFemale = false;
        if (!_.isUndefined(window.pageView)) {
            this.isFemale =
                window.pageView.activityAthlete() &&
                window.pageView.activityAthlete().get("gender") != "M";
        }
    }

    protected setNewLabelsValues(): void {
        this.deltaKomLabel = "&Delta;" + this.crTitle();
        this.deltaPRLabel = "&Delta;PR";
        this.deltaYearPRLabel = "&Delta;yPR";
    }

    protected findClubCurrentSegmentEffortDate(
        segmentId: number,
        segmentEffortId: number,
        page?: number,
        deferred?: JQueryDeferred<any>,
        fetchedLeaderboardData?: EffortInfo[]
    ): JQueryPromise<any> {
        if (!page) {
            page = 1;
        }
        if (!deferred) {
            deferred = $.Deferred();
        }

        if (!fetchedLeaderboardData) {
            fetchedLeaderboardData = [];
        }

        const perPage = 50;
        let clubId = 280246;

        if (!this.isBike) {
clubId = 204367;
        }

        console.log("look up");

        const jqxhr: JQueryXHR = $.getJSON(
            "/segments/" +
                segmentId +
                "/leaderboard?raw=true&page=" +
                page +
                "&per_page=" +
                perPage +
                "&viewer_context=false" +
                "&filter=club&club_id=" + clubId
        );

        let currentSegmentEffortDateTime: Date = null;

        jqxhr
            .done((leaderBoardData: LeaderBoardData) => {
                    deferred.resolve(
                        leaderBoardData
                    );
            })
            .fail((error: any) => {
                deferred.reject(error);
            });

        return deferred.promise();
    }

    protected findCurrentSegmentEffortDate(
        segmentId: number,
        segmentEffortId: number,
        page?: number,
        deferred?: JQueryDeferred<any>,
        fetchedLeaderboardData?: EffortInfo[]
    ): JQueryPromise<any> {
        if (!page) {
            page = 1;
        }
        if (!deferred) {
            deferred = $.Deferred();
        }

        if (!fetchedLeaderboardData) {
            fetchedLeaderboardData = [];
        }

        const perPage = 50;

        // https://www.strava.com/segments/19727405/leaderboard?raw=true&page=1&per_page=10&viewer_context=true&filter=club&gender=all&club_id=280246&_=1563562198577

        // https://www.strava.com/segments/19727405/leaderboard?raw=true&page=1&per_page=10&viewer_context=true&filter=overall&gender=all&_=1563562198578

        const jqxhr: JQueryXHR = $.getJSON(
            "/segments/" +
                segmentId +
                "/leaderboard?raw=true&page=" +
                page +
                "&per_page=" +
                perPage +
                "&viewer_context=false&filter=my_results"
        );

        let currentSegmentEffortDateTime: Date = null;

        jqxhr
            .done((leaderBoardData: LeaderBoardData) => {
                for (
                    let i = 0, max = leaderBoardData.top_results.length;
                    i < max;
                    i++
                ) {
                    leaderBoardData.top_results[i].__dateTime = new Date(
                        leaderBoardData.top_results[i].start_date_local_raw
                    );
                    if (leaderBoardData.top_results[i].id == segmentEffortId) {
                        currentSegmentEffortDateTime =
                            leaderBoardData.top_results[i].__dateTime;
                        // no break !
                    }
                }

                // Make any recursive leaderBoardData fetched flatten with previous one
                fetchedLeaderboardData = _.flatten(
                    _.union(leaderBoardData.top_results, fetchedLeaderboardData)
                );

                if (currentSegmentEffortDateTime) {
                    deferred.resolve(
                        currentSegmentEffortDateTime,
                        fetchedLeaderboardData
                    );
                } else {
                    // Not yet resolved then seek recursive on next page
            this.findCurrentSegmentEffortDate(segmentId, segmentEffortId, page + 1, deferred, fetchedLeaderboardData);
                }
            })
            .fail((error: any) => {
                deferred.reject(error);
            });

        return deferred.promise();
    }

    protected handleTimeDifferenceAlongUserLeaderBoard(
        leaderBoardData: EffortInfo[],
        currentSegmentEffortDateTime: Date,
        elapsedTime: number,
        segmentEffortId: number,
        deltaPRCell: JQuery,
        deltaYearPRCell: JQuery
    ): void {
        let previousPersonalSeconds: number,
            previousPersonalDate: Date,
            currentYearPRSeconds: number,
            currentYearPRDate: Date;

        if (!currentSegmentEffortDateTime) {
            // We are going are a place is shared by several people. Use current activity date instead?!
            // Or find on page 2... @ "/segments/" + leaderBoardData.segment_id + "/leaderboard?raw=true&page=2
            deltaPRCell.html("-");
            deltaYearPRCell.html("-");
            return;
        }

        // Sort results from best to worst
        leaderBoardData = leaderBoardData.sort(
            (left: EffortInfo, right: EffortInfo) => {
                return left.rank - right.rank;
            }
        );

        let deltaTime: number;
        let percentTime: number;

        if (this.showDifferenceToPR) {
            for (let i = 0; i < leaderBoardData.length; i++) {
                if (
                    leaderBoardData[i].__dateTime < currentSegmentEffortDateTime
                ) {
                    previousPersonalSeconds =
                        leaderBoardData[i].elapsed_time_raw;
                    previousPersonalDate = leaderBoardData[i].start_date_local;
                    break;
                }
            }

            if (previousPersonalSeconds) {
                deltaTime = elapsedTime - previousPersonalSeconds;
                percentTime = (elapsedTime / previousPersonalSeconds - 1) * 100;
                deltaPRCell.html(
                    "<span title='Time difference with your previous PR time (" +
                        Helper.secondsToHHMMSS(previousPersonalSeconds, true) +
                        " on " +
                        previousPersonalDate +
                        ")' style='font-size:11px; color:" +
                        (deltaTime > 0 ? "#FF5555" : "#2EB92E") +
                        ";'>" +
                        (Math.sign(deltaTime) == 1 ? "+" : "-") +
                        Helper.secondsToHHMMSS(Math.abs(deltaTime), true) +
                        "<br/>" +
                        (Math.sign(percentTime) == 1 ? "+" : "") +
                        percentTime.toFixed(1) +
                        "%</span>"
                );
            } else {
                deltaPRCell.html(
                    "<span title='First cross' style='font-size:11px; color: grey;'>1X</span>"
                );
            }
        }

        if (this.showDifferenceToPR && this.showDifferenceToCurrentYearPR) {
            let resultsThisYear: EffortInfo[] = [];

            for (let j = 0; j < leaderBoardData.length; j++) {
                if (
                    leaderBoardData[j].__dateTime.getFullYear() ===
                    currentSegmentEffortDateTime.getFullYear()
                ) {
                    currentYearPRSeconds = leaderBoardData[j].elapsed_time_raw;
                    currentYearPRDate = leaderBoardData[j].start_date_local;
                    resultsThisYear.push(leaderBoardData[j]);
                }
            }

            // Sort results by elapsed_time_raw ascending
            resultsThisYear = resultsThisYear.sort(
                (left: EffortInfo, right: EffortInfo) => {
                    return left.elapsed_time_raw - right.elapsed_time_raw;
                }
            );

            const predicate = {
                __dateTime: currentSegmentEffortDateTime
            } as Partial<EffortInfo>;

            const currentActivityResult = _.find(resultsThisYear, predicate);

            let previousBestResultThisYear: EffortInfo = null;
            _.some(resultsThisYear, (result: EffortInfo) => {
                if (
                    result.activity_id !== currentActivityResult.activity_id &&
                    result.__dateTime < currentActivityResult.__dateTime
                ) {
                    previousBestResultThisYear = result;
                    return true;
                }
            });

            if (currentYearPRSeconds) {
                if (!previousPersonalSeconds) {
                    // No Previous PR here, so no Y previous PR..
                    deltaYearPRCell.html(
                        "<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>"
                    );
                } else if (currentYearPRSeconds - previousPersonalSeconds < 0) {
                    // Current Year activity beat PR
                    if (previousBestResultThisYear) {
                        deltaTime =
                            currentActivityResult.elapsed_time_raw -
                            previousBestResultThisYear.elapsed_time_raw;
                        percentTime =
                            (currentActivityResult.elapsed_time_raw /
                                previousBestResultThisYear.elapsed_time_raw -
                                1) *
                            100;
                        deltaYearPRCell.html(
                            "<span title='Time difference with your previous best result this year (" +
                                Helper.secondsToHHMMSS(
                                    previousBestResultThisYear.elapsed_time_raw,
                                    true
                                ) +
                                " on " +
                                previousBestResultThisYear.start_date_local +
                                ")' style='font-size:11px; color:" +
                                (deltaTime > 0 ? "#FF5555" : "#2EB92E") +
                                ";'>" +
                                (Math.sign(deltaTime) == 1 ? "+" : "-") +
                                Helper.secondsToHHMMSS(
                                    Math.abs(deltaTime),
                                    true
                                ) +
                                "<br/>" +
                                (Math.sign(percentTime) == 1 ? "+" : "") +
                                percentTime.toFixed(1) +
                                "%</span>"
                        );
                    } else {
                        // NEW PR This ride of Current Year
                        deltaYearPRCell.html(
                            "<span title='This time beats previous PR. Time difference with your previous PR time  (" +
                                Helper.secondsToHHMMSS(
                                    previousPersonalSeconds,
                                    true
                                ) +
                                " on " +
                                previousPersonalDate +
                                ")' style='font-size:11px; color: grey;'>&#9733;</span>"
                        );
                    }
                } else {
                    if (previousBestResultThisYear) {
                        deltaTime =
                            currentActivityResult.elapsed_time_raw -
                            previousBestResultThisYear.elapsed_time_raw;
                        percentTime =
                            (currentActivityResult.elapsed_time_raw /
                                previousBestResultThisYear.elapsed_time_raw -
                                1) *
                            100;
                        deltaYearPRCell.html(
                            "<span title='Time difference with your previous best result this year (" +
                                Helper.secondsToHHMMSS(
                                    previousBestResultThisYear.elapsed_time_raw,
                                    true
                                ) +
                                " on " +
                                previousBestResultThisYear.start_date_local +
                                ")' style='font-size:11px; color:" +
                                (deltaTime > 0 ? "#FF5555" : "#2EB92E") +
                                ";'>" +
                                (Math.sign(deltaTime) == 1 ? "+" : "-") +
                                Helper.secondsToHHMMSS(
                                    Math.abs(deltaTime),
                                    true
                                ) +
                                "<br/>" +
                                (Math.sign(percentTime) == 1 ? "+" : "") +
                                percentTime.toFixed(1) +
                                "%</span>"
                        );
                    } else {
                        deltaTime = elapsedTime - currentYearPRSeconds;

                        if (deltaTime) {
                            deltaYearPRCell.html(
                                "<span title='Time difference with your current year PR time (" +
                                    Helper.secondsToHHMMSS(
                                        currentYearPRSeconds,
                                        true
                                    ) +
                                    " on " +
                                    currentYearPRDate +
                                    ")' style='font-size:11px; color:" +
                                    (deltaTime > 0 ? "#FF5555" : "#2EB92E") +
                                    ";'>" +
                                    (Math.sign(deltaTime) == 1 ? "+" : "-") +
                                    Helper.secondsToHHMMSS(
                                        Math.abs(deltaTime),
                                        true
                                    ) +
                                    "</span>"
                            );
                        } else {
                            deltaYearPRCell.html(
                                "<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>"
                            );
                        }
                    }
                }
            } else {
                deltaYearPRCell.html(
                    "<span title='First cross this year' style='font-size:11px; color: grey;'>1X</span>"
                );
            }
        }
    }

    protected getColorForPercentage(pct: number): string {
        // invert percentage
        pct = 1 - pct;

        const percentColors: any[] = [
            {
                pct: 0.0,
                color: {
                    r: 0xff,
                    g: 0x55,
                    b: 0x55
                }
            },
            {
                pct: 0.5,
                color: {
                    r: 0xff,
                    g: 0xff,
                    b: 0
                }
            },
            {
                pct: 1.0,
                color: {
                    r: 0x00,
                    g: 0xff,
                    b: 0x00
                }
            }
        ];

        let i: number;
        for (i = 1; i < percentColors.length - 1; i++) {
            if (pct < percentColors[i].pct) {
                break;
            }
        }
        const lower: any = percentColors[i - 1];
        const upper: any = percentColors[i];
        const range: number = upper.pct - lower.pct;
        const rangePct: number = (pct - lower.pct) / range;
        const pctLower: number = 1 - rangePct;
        const pctUpper: number = rangePct;
        const color: any = {
            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };
        return "rgb(" + [color.r, color.g, color.b].join(",") + ")";
        // or output as hex if preferred
    }
}
