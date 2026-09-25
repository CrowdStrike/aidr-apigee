# CrowdStrike AIDR + Apigee

A shared flow bundle that guards LLM inputs and outputs using CrowdStrike AIDR.
It intercepts Vertex AI `generateContent` requests and responses, calls the AIDR
AI Guard API, and either passes traffic through, rewrites it, or blocks it based
on the guard result.

## How it works

The shared flow runs the same pipeline for both input (request) and output (response) phases.

AIDR can return one of three outcomes:

| `blocked` | `transformed` | Result |
|-----------|---------------|--------|
| `false` | `false` | Traffic passes through unchanged |
| `false` | `true` | Request or response body is rewritten with `guard_output` |
| `true` | — | Proxy raises a fault and returns an error to the caller |

## Setup

### 1. Deploy the shared flow

Download the [latest release](https://github.com/crowdstrike/aidr-apigee/releases),
then import and deploy it in the Apigee console:

1. Go to [Shared flows](https://console.cloud.google.com/apigee/sharedflows) and select **Upload bundle**
2. Name it `cs-aidr-guard`
3. Deploy it to the same environment as your API proxy

Or use `apigeecli` from the repo root:

```bash
export APIGEE_ORG=YOUR_GCP_PROJECT
export APIGEE_ENV=YOUR_ENVIRONMENT
export TOKEN=$(gcloud auth print-access-token)

apigeecli sharedflows create bundle \
  --name cs-aidr-guard \
  --proxy-zip aidr-guard/sharedflowbundle \
  --org $APIGEE_ORG \
  --token $TOKEN

apigeecli sharedflows deploy \
  --name cs-aidr-guard \
  --env $APIGEE_ENV \
  --org $APIGEE_ORG \
  --token $TOKEN
```

### 2. Add policies to your proxy

Create three policies in your API proxy's `policies/` directory.

#### `AM-SetAIDRConfig` — sets credentials

Add this to your proxy's **PreFlow request**, before the FlowCallouts. It sets
the two variables the shared flow requires: `cs_aidr_token` (your CrowdStrike
`pts_*` token) and `aiguard_base_url`.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage async="false" continueOnError="false" enabled="true" name="AM-SetAIDRConfig">
  <DisplayName>AM-SetAIDRConfig</DisplayName>
  <Properties/>
  <AssignVariable>
    <Name>cs_aidr_token</Name>
    <Value>pts_tokentokentoken</Value>
  </AssignVariable>
  <AssignVariable>
    <Name>aiguard_base_url</Name>
    <Value>api.crowdstrike.com</Value>
  </AssignVariable>
  <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>
```

#### `FC-LLMGuardInput` — guards the request

Add this to your proxy's **PreFlow request**, after `AM-SetAIDRConfig`. It runs
the shared flow against the incoming user message before it reaches your LLM target.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<FlowCallout async="false" continueOnError="false" enabled="true" name="FC-LLMGuardInput">
  <DisplayName>FC-LLMGuardInput</DisplayName>
  <Properties/>
  <SharedFlowBundle>cs-aidr-guard</SharedFlowBundle>
</FlowCallout>
```

#### `FC-LLMGuardOutput` — guards the response

Add this to your proxy's **PostFlow response**. It runs the shared flow against
the LLM's response before it is returned to the caller.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<FlowCallout async="false" continueOnError="false" enabled="true" name="FC-LLMGuardOutput">
  <DisplayName>FC-LLMGuardOutput</DisplayName>
  <Properties/>
  <SharedFlowBundle>cs-aidr-guard</SharedFlowBundle>
</FlowCallout>
```

### 3. Wire the policies into your proxy endpoint

In your proxy endpoint XML (`proxies/default.xml`), reference the policies in
the correct flows:

```xml
<ProxyEndpoint name="default">
  <PreFlow name="PreFlow">
    <Request>
      <Step><Name>AM-SetAIDRConfig</Name></Step>
      <Step><Name>FC-LLMGuardInput</Name></Step>
    </Request>
  </PreFlow>
  <PostFlow name="PostFlow">
    <Response>
      <Step><Name>FC-LLMGuardOutput</Name></Step>
    </Response>
  </PostFlow>
  ...
</ProxyEndpoint>
```

## Request format

This shared flow expects API proxy requests to use the
[Vertex AI `generateContent`](https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.endpoints/generateContent)
request body format.
