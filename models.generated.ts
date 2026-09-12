import type { MixRouteProviderModel } from "./provider-config.ts";

// First-run fallback before the runtime-discovered catalog is cached; regenerated with scripts/generate-models.ts.
// Generated on 2026-09-12T13:51:21.718Z.
export const MIXROUTE_MODELS: MixRouteProviderModel[] = [
    {
        "id": "claude-fable-5",
        "name": "Claude Fable 5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 10,
            "output": 50,
            "cacheRead": 1,
            "cacheWrite": 12.5
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-fable-5-1",
        "name": "Claude Fable 5.1",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 10,
            "output": 50,
            "cacheRead": 0.25,
            "cacheWrite": 12.5
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-haiku-4-5",
        "name": "Claude Haiku 4.5 (latest)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1,
            "output": 5,
            "cacheRead": 0.1,
            "cacheWrite": 1.25
        },
        "contextWindow": 200000,
        "maxTokens": 64000
    },
    {
        "id": "claude-haiku-4-5-20251001",
        "name": "Claude Haiku 4.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1,
            "output": 5,
            "cacheRead": 0.1,
            "cacheWrite": 1.25
        },
        "contextWindow": 200000,
        "maxTokens": 64000
    },
    {
        "id": "claude-opus-4-5",
        "name": "Claude Opus 4.5 (latest)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 200000,
        "maxTokens": 64000
    },
    {
        "id": "claude-opus-4-5-20251101",
        "name": "Claude Opus 4.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 200000,
        "maxTokens": 64000
    },
    {
        "id": "claude-opus-4-6",
        "name": "Claude Opus 4.6",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-opus-4-7",
        "name": "Claude Opus 4.7",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-opus-4-8",
        "name": "Claude Opus 4.8",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-opus-5",
        "name": "Claude Opus 5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-sonnet-4-5",
        "name": "Claude Sonnet 4.5 (latest)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 3,
            "output": 15,
            "cacheRead": 0.3,
            "cacheWrite": 3.75
        },
        "contextWindow": 1000000,
        "maxTokens": 64000
    },
    {
        "id": "claude-sonnet-4-5-20250929",
        "name": "Claude Sonnet 4.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 3,
            "output": 15,
            "cacheRead": 0.3,
            "cacheWrite": 3.75
        },
        "contextWindow": 1000000,
        "maxTokens": 64000
    },
    {
        "id": "claude-sonnet-4-6",
        "name": "Claude Sonnet 4.6",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 3,
            "output": 15,
            "cacheRead": 0.3,
            "cacheWrite": 3.75
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "claude-sonnet-5",
        "name": "Claude Sonnet 5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 10,
            "cacheRead": 0.2,
            "cacheWrite": 2.5
        },
        "contextWindow": 1000000,
        "maxTokens": 128000
    },
    {
        "id": "deepseek-flash",
        "name": "DeepSeek V4.1 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.15,
            "output": 0.6,
            "cacheRead": 0.003,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "deepseek-r1",
        "name": "DeepSeek R1",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.574,
            "output": 2.294,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 16384
    },
    {
        "id": "deepseek-v3",
        "name": "DeepSeek V3",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.287,
            "output": 1.147,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 65536,
        "maxTokens": 8192
    },
    {
        "id": "deepseek-v3-0324",
        "name": "DeepSeek-V3-0324",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16000
    },
    {
        "id": "deepseek-v3-2-251201",
        "name": "DeepSeek V3.2 (251201)",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.62,
            "output": 1.85,
            "cacheRead": 0.13449999999999998,
            "cacheWrite": 0
        },
        "contextWindow": 163840,
        "maxTokens": 81920
    },
    {
        "id": "deepseek-v3.1",
        "name": "DeepSeek V3.1",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.574,
            "output": 1.721,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 65536
    },
    {
        "id": "deepseek-v3.1-250821",
        "name": "DeepSeek V3.1 (250821)",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.574,
            "output": 1.721,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 65536
    },
    {
        "id": "deepseek-v3.2",
        "name": "DeepSeek V3.2",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.62,
            "output": 1.85,
            "cacheRead": 0.13449999999999998,
            "cacheWrite": 0
        },
        "contextWindow": 163840,
        "maxTokens": 81920
    },
    {
        "id": "deepseek-v3.2-speciale",
        "name": "DeepSeek-V3.2-Speciale",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.58,
            "output": 1.68,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 128000
    },
    {
        "id": "deepseek-v4-flash",
        "name": "DeepSeek V4 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.15,
            "output": 0.6,
            "cacheRead": 0.003,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "deepseek-v4-flash-0731",
        "name": "DeepSeek V4 Flash 0731",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.2,
            "output": 0.4,
            "cacheRead": 0.04,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "deepseek-v4-flash-vision-exp",
        "name": "DeepSeek V4 Flash Vision Exp",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.15,
            "output": 0.6,
            "cacheRead": 0.003,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "deepseek-v4-pro",
        "name": "DeepSeek V4 Pro",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.435,
            "output": 0.87,
            "cacheRead": 0.003625,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "deepseek-v4.1-flash",
        "name": "DeepSeek V4.1 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.255552,
            "output": 1.27776,
            "cacheRead": 0.0127776,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 384000
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.3,
            "output": 2.5,
            "cacheRead": 0.03,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-2.5-flash-lite",
        "name": "Gemini 2.5 Flash-Lite",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.1,
            "output": 0.4,
            "cacheRead": 0.01,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0.375
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash Preview",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.5,
            "output": 3,
            "cacheRead": 0.05,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.1-flash-lite",
        "name": "Gemini 3.1 Flash Lite",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 1.5,
            "cacheRead": 0.025,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.1-flash-lite-preview",
        "name": "Gemini 3.1 Flash Lite Preview",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 1.5,
            "cacheRead": 0.025,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.1-pro-preview",
        "name": "Gemini 3.1 Pro Preview",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 12,
            "cacheRead": 0.2,
            "cacheWrite": 0.375
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.1-pro-preview-customtools",
        "name": "Gemini 3.1 Pro Preview Custom Tools",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 12,
            "cacheRead": 0.2,
            "cacheWrite": 0.375
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.5-flash",
        "name": "Gemini 3.5 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.5,
            "output": 9,
            "cacheRead": 0.15,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.5-flash-lite",
        "name": "Gemini 3.5 Flash Lite",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.3,
            "output": 2.5,
            "cacheRead": 0.03,
            "cacheWrite": 0.0833333333333333
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.6-flash",
        "name": "Gemini 3.6 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.75,
            "output": 3.75,
            "cacheRead": 0.075,
            "cacheWrite": 0.0416666666666667
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.7-flash",
        "name": "Gemini 3.7 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.75,
            "output": 3.75,
            "cacheRead": 0.075,
            "cacheWrite": 0.0416666666666667
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-3.8-flash",
        "name": "Gemini 3.8 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.75,
            "output": 3.75,
            "cacheRead": 0.075,
            "cacheWrite": 0.0416666666666667
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-flash-latest",
        "name": "Gemini Flash Latest",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.75,
            "output": 3.75,
            "cacheRead": 0.075,
            "cacheWrite": 0.0416666666666667
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-flash-lite-latest",
        "name": "Gemini Flash-Lite Latest",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.3,
            "output": 2.5,
            "cacheRead": 0.03,
            "cacheWrite": 0
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "gemini-omni-1.1-flash",
        "name": "gemini-omni-1.1-flash",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "gemini-pro-latest",
        "name": "Gemini Pro Latest",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 12,
            "cacheRead": 0.2,
            "cacheWrite": 0.375
        },
        "contextWindow": 1048576,
        "maxTokens": 65536
    },
    {
        "id": "glm-3-turbo",
        "name": "glm-3-turbo",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4",
        "name": "glm-4",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-0520",
        "name": "glm-4-0520",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-air",
        "name": "glm-4-air",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-airx",
        "name": "glm-4-airx",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-alltools",
        "name": "glm-4-alltools",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-flash",
        "name": "glm-4-flash",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-long",
        "name": "GLM-4 Long",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.2006,
            "output": 0.2006,
            "cacheRead": 0.1003,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 4096
    },
    {
        "id": "glm-4-plus",
        "name": "glm-4-plus",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4.5",
        "name": "GLM-4.5",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.6,
            "output": 2.2,
            "cacheRead": 0.11,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 98304
    },
    {
        "id": "glm-4.5-air",
        "name": "GLM-4.5-Air",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.2,
            "output": 1.1,
            "cacheRead": 0.03,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 98304
    },
    {
        "id": "glm-4.5-airx",
        "name": "GLM-4.5 AirX",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.1,
            "output": 4.5,
            "cacheRead": 0.22,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "glm-4.5-flash",
        "name": "GLM-4.5-Flash",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 98304
    },
    {
        "id": "glm-4.5-x",
        "name": "GLM-4.5 X",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 2.2,
            "output": 8.9,
            "cacheRead": 0.45,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "glm-4.6",
        "name": "GLM-4.6",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.6,
            "output": 2.2,
            "cacheRead": 0.11,
            "cacheWrite": 0
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "glm-4.7",
        "name": "GLM-4.7",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.6,
            "output": 2.2,
            "cacheRead": 0.11,
            "cacheWrite": 0
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "glm-4.7-flashx",
        "name": "GLM-4.7-FlashX",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.07,
            "output": 0.4,
            "cacheRead": 0.01,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 131072
    },
    {
        "id": "glm-4v",
        "name": "glm-4v",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-4v-plus",
        "name": "glm-4v-plus",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "glm-5",
        "name": "GLM-5",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1,
            "output": 3.2,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "glm-5-turbo",
        "name": "GLM-5-Turbo",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.2,
            "output": 4,
            "cacheRead": 0.24,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 131072
    },
    {
        "id": "glm-5.1",
        "name": "GLM-5.1",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.4,
            "output": 4.4,
            "cacheRead": 0.26,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 131072
    },
    {
        "id": "glm-5.2",
        "name": "GLM-5.2",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.4,
            "output": 4.4,
            "cacheRead": 0.26,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 131072
    },
    {
        "id": "glm-5.3",
        "name": "GLM-5.3",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.4,
            "output": 4.4,
            "cacheRead": 0.26,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 131072
    },
    {
        "id": "glm-5.3-flash",
        "name": "GLM-5.3-Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.075,
            "output": 0.25,
            "cacheRead": 0.015,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 131072
    },
    {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5-turbo",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.5,
            "output": 1.5,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 16385,
        "maxTokens": 4096
    },
    {
        "id": "gpt-3.5-turbo-0125",
        "name": "GPT-3.5 Turbo 0125",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.5,
            "output": 1.5,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 16384,
        "maxTokens": 16384
    },
    {
        "id": "gpt-3.5-turbo-1106",
        "name": "GPT-3.5 Turbo 1106",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1,
            "output": 2,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 16384,
        "maxTokens": 16384
    },
    {
        "id": "gpt-3.5-turbo-16k",
        "name": "OpenAI: GPT-3.5 Turbo 16k",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 3,
            "output": 4,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 16385,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4",
        "name": "GPT-4",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 30,
            "output": 60,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 8192,
        "maxTokens": 8192
    },
    {
        "id": "gpt-4-0125-preview",
        "name": "gpt-4-0125-preview",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4-0613",
        "name": "GPT-4 (0613)",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 30,
            "output": 60,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 8192,
        "maxTokens": 8192
    },
    {
        "id": "gpt-4-1106-preview",
        "name": "gpt-4-1106-preview",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 10,
            "output": 30,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4-turbo-2024-04-09",
        "name": "GPT-4 Turbo (2024-04-09)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 10,
            "output": 30,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4.1",
        "name": "GPT-4.1",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 8,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4.1-2025-04-14",
        "name": "GPT-4.1 (2025-04-14)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 8,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4.1-mini",
        "name": "GPT-4.1 mini",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.4,
            "output": 1.6,
            "cacheRead": 0.1,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4.1-mini-2025-04-14",
        "name": "OpenAI GPT-4.1 Mini",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.39999999999999997,
            "output": 1.5999999999999999,
            "cacheRead": 0.09999999999999999,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4.1-nano",
        "name": "GPT-4.1 nano",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.1,
            "output": 0.4,
            "cacheRead": 0.025,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4.1-nano-2025-04-14",
        "name": "GPT-4.1 nano (2025-04-14)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.1,
            "output": 0.4,
            "cacheRead": 0.025,
            "cacheWrite": 0
        },
        "contextWindow": 1047576,
        "maxTokens": 32768
    },
    {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.5,
            "output": 10,
            "cacheRead": 1.25,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "gpt-4o-2024-05-13",
        "name": "GPT-4o (2024-05-13)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 15,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 4096
    },
    {
        "id": "gpt-4o-2024-08-06",
        "name": "GPT-4o (2024-08-06)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.5,
            "output": 10,
            "cacheRead": 1.25,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "gpt-4o-2024-11-20",
        "name": "GPT-4o (2024-11-20)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.5,
            "output": 10,
            "cacheRead": 1.25,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "gpt-4o-mini",
        "name": "GPT-4o mini",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.15,
            "output": 0.6,
            "cacheRead": 0.075,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "gpt-4o-mini-2024-07-18",
        "name": "OpenAI: GPT-4o-mini (2024-07-18)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.15,
            "output": 0.6,
            "cacheRead": 0.075,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "gpt-5",
        "name": "GPT-5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-2025-08-07",
        "name": "GPT-5 (2025-08-07)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-codex",
        "name": "GPT-5-Codex",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.13,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-mini",
        "name": "GPT-5 Mini",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 2,
            "cacheRead": 0.025,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-mini-2025-08-07",
        "name": "GPT-5 Mini (2025-08-07)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 2,
            "cacheRead": 0.025,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-nano",
        "name": "GPT-5 Nano",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.05,
            "output": 0.4,
            "cacheRead": 0.005,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-nano-2025-08-07",
        "name": "GPT-5 Nano (2025-08-07)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.05,
            "output": 0.4,
            "cacheRead": 0.005,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5-pro",
        "name": "GPT-5 Pro",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 15,
            "output": 120,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 272000
    },
    {
        "id": "gpt-5-pro-2025-10-06",
        "name": "GPT-5 Pro (2025-10-06)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 15,
            "output": 120,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 272000
    },
    {
        "id": "gpt-5.1",
        "name": "GPT-5.1",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.1-2025-11-13",
        "name": "GPT-5.1 (2025-11-13)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.1-codex",
        "name": "GPT-5.1 Codex",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.1-codex-max",
        "name": "GPT-5.1 Codex Max",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 10,
            "cacheRead": 0.125,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.1-codex-mini",
        "name": "GPT-5.1 Codex Mini",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 2,
            "cacheRead": 0.025,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.2",
        "name": "GPT-5.2",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.75,
            "output": 14,
            "cacheRead": 0.175,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.2-2025-12-11",
        "name": "GPT-5.2 (2025-12-11)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.75,
            "output": 14,
            "cacheRead": 0.175,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.2-codex",
        "name": "GPT-5.2 Codex",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.75,
            "output": 14,
            "cacheRead": 0.175,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.3-codex",
        "name": "GPT-5.3 Codex",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.75,
            "output": 14,
            "cacheRead": 0.175,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4",
        "name": "GPT-5.4",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.5,
            "output": 15,
            "cacheRead": 0.25,
            "cacheWrite": 0
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4-2026-03-05",
        "name": "GPT-5.4 (2026-03-05)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.5,
            "output": 15,
            "cacheRead": 0.25,
            "cacheWrite": 0
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4-mini",
        "name": "GPT-5.4 mini",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.75,
            "output": 4.5,
            "cacheRead": 0.075,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4-nano",
        "name": "GPT-5.4 nano",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.2,
            "output": 1.25,
            "cacheRead": 0.02,
            "cacheWrite": 0
        },
        "contextWindow": 400000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4-pro",
        "name": "GPT-5.4 Pro",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 30,
            "output": 180,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.4-pro-2026-03-05",
        "name": "GPT-5.4 Pro (2026-03-05)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 30,
            "output": 180,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.5",
        "name": "GPT-5.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 30,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.6-luna",
        "name": "GPT-5.6 Luna",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.2,
            "output": 1.2,
            "cacheRead": 0.02,
            "cacheWrite": 0.25
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.6-sol",
        "name": "GPT-5.6 Sol",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 4,
            "output": 20,
            "cacheRead": 0.4,
            "cacheWrite": 5
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-5.6-terra",
        "name": "GPT-5.6 Terra",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 12,
            "cacheRead": 0.2,
            "cacheWrite": 2.5
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-6-astra",
        "name": "GPT-6 Astra",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 10,
            "output": 50,
            "cacheRead": 1,
            "cacheWrite": 12.5
        },
        "contextWindow": 1050000,
        "maxTokens": 128000
    },
    {
        "id": "gpt-chat-latest",
        "name": "GPT Chat Latest",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 5,
            "output": 30,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 16384
    },
    {
        "id": "grok-3",
        "name": "xAI Grok 3",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 3,
            "output": 15,
            "cacheRead": 0.75,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 131072
    },
    {
        "id": "grok-3-mini",
        "name": "xAI Grok 3 Mini",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.3,
            "output": 0.5,
            "cacheRead": 0.075,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 131072
    },
    {
        "id": "grok-4-0709",
        "name": "xAI Grok 4 (0709)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2.7,
            "output": 13.5,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 256000,
        "maxTokens": 8192
    },
    {
        "id": "grok-4-1-fast-non-reasoning",
        "name": "Grok 4.1 Fast (Non-Reasoning)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.2,
            "output": 0.5,
            "cacheRead": 0.05,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 8192
    },
    {
        "id": "grok-4-1-fast-reasoning",
        "name": "Grok 4.1 Fast (Reasoning)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.2,
            "output": 0.5,
            "cacheRead": 0.05,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 8192
    },
    {
        "id": "grok-4-20-non-reasoning",
        "name": "Grok 4.20 (Non-Reasoning)",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 262000,
        "maxTokens": 8192
    },
    {
        "id": "grok-4-20-reasoning",
        "name": "Grok 4.20 (Reasoning)",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 262000,
        "maxTokens": 8192
    },
    {
        "id": "grok-4-fast-non-reasoning",
        "name": "xAI Grok 4 Fast Non-Reasoning",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.19999999999999998,
            "output": 0.5,
            "cacheRead": 0.049999999999999996,
            "cacheWrite": 0
        },
        "contextWindow": 2000000,
        "maxTokens": 2000000
    },
    {
        "id": "grok-4-fast-reasoning",
        "name": "xAI: Grok 4 Fast Reasoning",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.19999999999999998,
            "output": 0.5,
            "cacheRead": 0.049999999999999996,
            "cacheWrite": 0
        },
        "contextWindow": 2000000,
        "maxTokens": 2000000
    },
    {
        "id": "grok-4.2",
        "name": "grok-4.2",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "grok-4.20-0309-non-reasoning",
        "name": "Grok 4.20 (Non-Reasoning)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 2.5,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.20-0309-reasoning",
        "name": "Grok 4.20 (Reasoning)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 2.5,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.20-beta-0309-non-reasoning",
        "name": "Grok 4.20 (Non-Reasoning)",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 2000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.20-beta-0309-reasoning",
        "name": "Grok 4.20 (Reasoning)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 2000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.20-multi-agent-0309",
        "name": "Grok 4.20 Multi-Agent",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 2.5,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.20-multi-agent-beta-0309",
        "name": "grok-4.20-multi-agent-beta-0309",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "grok-4.3",
        "name": "Grok 4.3",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.25,
            "output": 2.5,
            "cacheRead": 0.2,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 30000
    },
    {
        "id": "grok-4.5",
        "name": "Grok 4.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0.3,
            "cacheWrite": 0
        },
        "contextWindow": 500000,
        "maxTokens": 500000
    },
    {
        "id": "grok-4.6",
        "name": "Grok 4.6",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 500000,
        "maxTokens": 500000
    },
    {
        "id": "grok-code-fast-1",
        "name": "xAI Grok Code Fast 1",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.19999999999999998,
            "output": 1.5,
            "cacheRead": 0.02,
            "cacheWrite": 0
        },
        "contextWindow": 256000,
        "maxTokens": 10000
    },
    {
        "id": "kimi-k2.5",
        "name": "Moonshot Kimi K2.5",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.574,
            "output": 2.411,
            "cacheRead": 0.07,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 32768
    },
    {
        "id": "kimi-k2.6",
        "name": "Kimi K2.6",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.95,
            "output": 4,
            "cacheRead": 0.16,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 262144
    },
    {
        "id": "kimi-k2.7-code",
        "name": "Kimi K2.7 Code",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.95,
            "output": 4,
            "cacheRead": 0.19,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 262144
    },
    {
        "id": "kimi-k3",
        "name": "Kimi K3",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 3,
            "output": 15,
            "cacheRead": 0.3,
            "cacheWrite": 0
        },
        "contextWindow": 1048576,
        "maxTokens": 131072
    },
    {
        "id": "llama-3.3-70b-instruct",
        "name": "Llama-3.3-70B-Instruct",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.71,
            "output": 0.71,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 32768
    },
    {
        "id": "llama-4-maverick-17b-128e-instruct-fp8",
        "name": "Llama 4 Maverick 17B 128E Instruct FP8",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 1,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 16384
    },
    {
        "id": "llama-4-scout-17b-16e-instruct",
        "name": "Llama 4 Scout 17B 16E Instruct",
        "reasoning": false,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.2,
            "output": 0.78,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 128000,
        "maxTokens": 8192
    },
    {
        "id": "mimo-v2.5-pro",
        "name": "MiMo-V2.5-Pro",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1048576,
        "maxTokens": 131072
    },
    {
        "id": "MiniMax-H3",
        "name": "MiniMax-H3",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 131072,
        "maxTokens": 4096
    },
    {
        "id": "MiniMax-M2",
        "name": "MiniMax-M2",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.3,
            "output": 1.2,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "MiniMax-M2.5",
        "name": "MiniMax-M2.5",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.3,
            "output": 1.2,
            "cacheRead": 0.027,
            "cacheWrite": 0
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "MiniMax-M2.7",
        "name": "MiniMax-M2.7",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0.3,
            "output": 1.2,
            "cacheRead": 0.06,
            "cacheWrite": 0.375
        },
        "contextWindow": 204800,
        "maxTokens": 131072
    },
    {
        "id": "MiniMax-M3",
        "name": "MiniMax-M3",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.3,
            "output": 1.2,
            "cacheRead": 0.06,
            "cacheWrite": 0
        },
        "contextWindow": 1048576,
        "maxTokens": 512000
    },
    {
        "id": "o1",
        "name": "o1",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 15,
            "output": 60,
            "cacheRead": 7.5,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o1-2024-12-17",
        "name": "o1 (2024-12-17)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 15,
            "output": 60,
            "cacheRead": 7.5,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o3",
        "name": "o3",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 8,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o3-2025-04-16",
        "name": "o3 (2025-04-16)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 8,
            "cacheRead": 0.5,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o3-mini",
        "name": "o3-mini",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.1,
            "output": 4.4,
            "cacheRead": 0.55,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o3-mini-2025-01-31",
        "name": "o3-mini (2025-01-31)",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.1,
            "output": 4.4,
            "cacheRead": 0.55,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o3-pro",
        "name": "o3-pro",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 20,
            "output": 80,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o4-mini",
        "name": "o4-mini",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.1,
            "output": 4.4,
            "cacheRead": 0.275,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "o4-mini-2025-04-16",
        "name": "o4-mini (2025-04-16)",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 1.1,
            "output": 4.4,
            "cacheRead": 0.275,
            "cacheWrite": 0
        },
        "contextWindow": 200000,
        "maxTokens": 100000
    },
    {
        "id": "qwen3-max",
        "name": "Qwen3 Max",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.2,
            "output": 6,
            "cacheRead": 0.156,
            "cacheWrite": 0.975
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3-max-preview",
        "name": "Qwen3 Max Preview",
        "reasoning": false,
        "input": [
            "text"
        ],
        "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 256000,
        "maxTokens": 64000
    },
    {
        "id": "qwen3.5-122b-a10b",
        "name": "Qwen3.5 122B-A10B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.4,
            "output": 3.2,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.5-27b",
        "name": "Qwen3.5 27B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.3,
            "output": 2.4,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.5-35b-a3b",
        "name": "Qwen3.5 35B-A3B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.25,
            "output": 2,
            "cacheRead": 0.15625,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.5-397b-a17b",
        "name": "Qwen3.5 397B-A17B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.6,
            "output": 3.6,
            "cacheRead": 0.22499999999999998,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.5-flash",
        "name": "Qwen3.5 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.172,
            "output": 1.72,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.5-plus",
        "name": "Qwen3.5 Plus",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.4,
            "output": 2.4,
            "cacheRead": 0,
            "cacheWrite": 0
        },
        "contextWindow": 1000000,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.6-27b",
        "name": "Qwen3.6 27B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.6,
            "output": 3.6,
            "cacheRead": 0.03,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.6-35b-a3b",
        "name": "Qwen3.6 35B-A3B",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.248,
            "output": 1.485,
            "cacheRead": 0.049999999999999996,
            "cacheWrite": 0
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.6-flash",
        "name": "Qwen3.6 Flash",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.1875,
            "output": 1.125,
            "cacheRead": 0,
            "cacheWrite": 0.234375
        },
        "contextWindow": 1000000,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.6-max-preview",
        "name": "Qwen3.6 Max Preview",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 1.3,
            "output": 7.8,
            "cacheRead": 0.13,
            "cacheWrite": 1.625
        },
        "contextWindow": 262144,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.6-plus",
        "name": "Qwen3.6 Plus",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 0.5,
            "output": 3,
            "cacheRead": 0.05,
            "cacheWrite": 0.625
        },
        "contextWindow": 1000000,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.7-max",
        "name": "Qwen3.7 Max",
        "reasoning": true,
        "input": [
            "text"
        ],
        "cost": {
            "input": 2.5,
            "output": 7.5,
            "cacheRead": 0.5,
            "cacheWrite": 3.125
        },
        "contextWindow": 1000000,
        "maxTokens": 65536
    },
    {
        "id": "qwen3.8-max",
        "name": "Qwen3.8 Max",
        "reasoning": true,
        "input": [
            "text",
            "image"
        ],
        "cost": {
            "input": 2,
            "output": 6,
            "cacheRead": 0.25,
            "cacheWrite": 2.5
        },
        "contextWindow": 1000000,
        "maxTokens": 131072
    }
];
