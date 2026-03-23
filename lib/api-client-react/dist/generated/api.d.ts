import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AnalysisResult, AnalyzeTextBody, ChatbotMessageBody, ChatbotResponse, CreateReportBody, GetReportsParams, HealthStatus, Report, TranscribeAudioBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Accepts audio file, transcribes it, and performs cognitive analysis
 * @summary Transcribe and analyze audio
 */
export declare const getTranscribeAudioUrl: () => string;
export declare const transcribeAudio: (transcribeAudioBody: TranscribeAudioBody, options?: RequestInit) => Promise<AnalysisResult>;
export declare const getTranscribeAudioMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transcribeAudio>>, TError, {
        data: BodyType<TranscribeAudioBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof transcribeAudio>>, TError, {
    data: BodyType<TranscribeAudioBody>;
}, TContext>;
export type TranscribeAudioMutationResult = NonNullable<Awaited<ReturnType<typeof transcribeAudio>>>;
export type TranscribeAudioMutationBody = BodyType<TranscribeAudioBody>;
export type TranscribeAudioMutationError = ErrorType<void>;
/**
 * @summary Transcribe and analyze audio
 */
export declare const useTranscribeAudio: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof transcribeAudio>>, TError, {
        data: BodyType<TranscribeAudioBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof transcribeAudio>>, TError, {
    data: BodyType<TranscribeAudioBody>;
}, TContext>;
/**
 * Analyze transcribed text for dementia risk markers
 * @summary Analyze text for cognitive markers
 */
export declare const getAnalyzeTextUrl: () => string;
export declare const analyzeText: (analyzeTextBody: AnalyzeTextBody, options?: RequestInit) => Promise<AnalysisResult>;
export declare const getAnalyzeTextMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeText>>, TError, {
        data: BodyType<AnalyzeTextBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzeText>>, TError, {
    data: BodyType<AnalyzeTextBody>;
}, TContext>;
export type AnalyzeTextMutationResult = NonNullable<Awaited<ReturnType<typeof analyzeText>>>;
export type AnalyzeTextMutationBody = BodyType<AnalyzeTextBody>;
export type AnalyzeTextMutationError = ErrorType<void>;
/**
 * @summary Analyze text for cognitive markers
 */
export declare const useAnalyzeText: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeText>>, TError, {
        data: BodyType<AnalyzeTextBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzeText>>, TError, {
    data: BodyType<AnalyzeTextBody>;
}, TContext>;
/**
 * @summary Get all reports for a user
 */
export declare const getGetReportsUrl: (params?: GetReportsParams) => string;
export declare const getReports: (params?: GetReportsParams, options?: RequestInit) => Promise<Report[]>;
export declare const getGetReportsQueryKey: (params?: GetReportsParams) => readonly ["/api/reports", ...GetReportsParams[]];
export declare const getGetReportsQueryOptions: <TData = Awaited<ReturnType<typeof getReports>>, TError = ErrorType<unknown>>(params?: GetReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getReports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetReportsQueryResult = NonNullable<Awaited<ReturnType<typeof getReports>>>;
export type GetReportsQueryError = ErrorType<unknown>;
/**
 * @summary Get all reports for a user
 */
export declare function useGetReports<TData = Awaited<ReturnType<typeof getReports>>, TError = ErrorType<unknown>>(params?: GetReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Save a report
 */
export declare const getCreateReportUrl: () => string;
export declare const createReport: (createReportBody: CreateReportBody, options?: RequestInit) => Promise<Report>;
export declare const getCreateReportMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, {
        data: BodyType<CreateReportBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, {
    data: BodyType<CreateReportBody>;
}, TContext>;
export type CreateReportMutationResult = NonNullable<Awaited<ReturnType<typeof createReport>>>;
export type CreateReportMutationBody = BodyType<CreateReportBody>;
export type CreateReportMutationError = ErrorType<void>;
/**
 * @summary Save a report
 */
export declare const useCreateReport: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, {
        data: BodyType<CreateReportBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createReport>>, TError, {
    data: BodyType<CreateReportBody>;
}, TContext>;
/**
 * @summary Get a specific report
 */
export declare const getGetReportUrl: (id: number) => string;
export declare const getReport: (id: number, options?: RequestInit) => Promise<Report>;
export declare const getGetReportQueryKey: (id: number) => readonly [`/api/reports/${number}`];
export declare const getGetReportQueryOptions: <TData = Awaited<ReturnType<typeof getReport>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetReportQueryResult = NonNullable<Awaited<ReturnType<typeof getReport>>>;
export type GetReportQueryError = ErrorType<void>;
/**
 * @summary Get a specific report
 */
export declare function useGetReport<TData = Awaited<ReturnType<typeof getReport>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a report
 */
export declare const getDeleteReportUrl: (id: number) => string;
export declare const deleteReport: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteReportMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteReport>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteReport>>, TError, {
    id: number;
}, TContext>;
export type DeleteReportMutationResult = NonNullable<Awaited<ReturnType<typeof deleteReport>>>;
export type DeleteReportMutationError = ErrorType<void>;
/**
 * @summary Delete a report
 */
export declare const useDeleteReport: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteReport>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteReport>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Send message to cognitive health chatbot
 */
export declare const getSendChatbotMessageUrl: () => string;
export declare const sendChatbotMessage: (chatbotMessageBody: ChatbotMessageBody, options?: RequestInit) => Promise<ChatbotResponse>;
export declare const getSendChatbotMessageMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatbotMessage>>, TError, {
        data: BodyType<ChatbotMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendChatbotMessage>>, TError, {
    data: BodyType<ChatbotMessageBody>;
}, TContext>;
export type SendChatbotMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendChatbotMessage>>>;
export type SendChatbotMessageMutationBody = BodyType<ChatbotMessageBody>;
export type SendChatbotMessageMutationError = ErrorType<void>;
/**
 * @summary Send message to cognitive health chatbot
 */
export declare const useSendChatbotMessage: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatbotMessage>>, TError, {
        data: BodyType<ChatbotMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendChatbotMessage>>, TError, {
    data: BodyType<ChatbotMessageBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map