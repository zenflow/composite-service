---
title: Motiviation
---

## Reusing Services

Sometimes we want to use some open-source (or just reusable) service in our app or service.
In the cases where we would like to include that reusable service as a component of our overall service,
rather than creating and managing an external dependency,
we can use `composite-service` to compose everything into a single service.

## Advantages of Running As a Single Service

1. Simplified deployments & devops; works smoothly with any PaaS provider; never a need to update production services in a certain order
2. Allows us to effectively use PaaS features like [Heroku's Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps)
3. With some PaaS providers (e.g. Heroku, render) saves the cost of hosting additional "apps" or "services"
4. Fewer steps (i.e. one step) to start the entire system (locally or in CI) for integration testing (manual or automated), and sometimes even for local development

## Microservices

Another possible use case is to develop & deploy a system of microservices as a single service,
to keep the advantages listed above, while gaining many of the advantages of microservices:
- Services can be developed independently, in different repositories, by different teams, **and or** in different languages
- One service crashing doesn't interrupt the others

Since the composed services still, on a lower level, run as independent programs,
they can easily be *de*composed at any time,
and run as separate services.
