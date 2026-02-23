# CrowdStrike AIDR + Apigee

A shared flow bundle that can be used to guard LLM inputs and outputs using
CrowdStrike AIDR.

## Setup

Download the [latest version](https://github.com/crowdstrike/aidr-apigee/releases)
of the CrowdStrike AIDR shared flow.

Import the shared flow into Apigee by going to [Shared flows](https://console.cloud.google.com/apigee/sharedflows)
and selecting **Upload bundle**. Name the new shared flow "cs-aidr-guard".
Deploy the shared flow to the same environment as your API proxy.

In your API proxy, create the following policies:

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
    <Value>api.eu-1.crowdstrike.com/aidr/aiguard</Value>
  </AssignVariable>
  <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>
```

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<FlowCallout async="false" continueOnError="false" enabled="true" name="FC-LLMGuardInput">
  <DisplayName>FC-LLMGuardInput</DisplayName>
  <Properties/>
  <SharedFlowBundle>cs-aidr-guard</SharedFlowBundle>
</FlowCallout>
```

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<FlowCallout async="false" continueOnError="false" enabled="true" name="FC-LLMGuardOutput">
  <DisplayName>FC-LLMGuardOutput</DisplayName>
  <Properties/>
  <SharedFlowBundle>cs-aidr-guard</SharedFlowBundle>
</FlowCallout>
```

## Request format

This shared flow expects API proxy requests to use the
[Vertex AI `generateContent`](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.endpoints/generateContent)
request body format.
