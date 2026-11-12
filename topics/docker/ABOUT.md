This Topic covers Docker from the inside out: what an image, a container and a registry are, how to write a Dockerfile for a small Java service, and how to get the result ready for an orchestrator such as Kubernetes. Running other people's images is assumed; writing your own is where it starts.

After this Topic you can:

- Explain how an image, a container and a registry differ, and predict what survives a stop, a restart and a removal
- Write a multi-stage Dockerfile with a small runtime image, a non-root user and good use of the build cache
- Tag an image meaningfully, push it to a registry and pull it elsewhere
- Configure a container from outside with environment variables, ports and mounted files
- Make an app orchestrator-friendly: logs to stdout, clean shutdown on SIGTERM, a health endpoint, the right CPU architecture
- Run an app and its database with Compose, and map each piece to its Kubernetes counterpart
