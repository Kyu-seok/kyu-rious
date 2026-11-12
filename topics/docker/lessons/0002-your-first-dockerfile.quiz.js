window.QUIZ = [
  {
    id: "docker/2/q1",
    section: "warmup",
    stem: "You start two containers from one image with <code>docker run -d</code>. What do they share?",
    options: ["Only the read-only image layers", "One writable layer between both", "The same running main process", "Nothing, since each copies everything"],
    answer: 0,
    why: "Containers share the image's read-only layers, and each gets its own writable layer and its own main process. <a href=\"https://docs.docker.com/engine/storage/drivers/\">Storage drivers</a>"
  },
  {
    id: "docker/2/q2",
    section: "warmup",
    stem: "<code>docker ps -a</code> lists one container as <code>Exited (0)</code> and another as <code>Exited (137)</code>. Which can you start again with its files intact?",
    options: ["Only Exited (0), a clean finish", "Only Exited (137), it was killed", "Both, until the container is removed", "Neither; exited containers lose their files"],
    answer: 2,
    why: "The exit code says how the main process ended, not whether the container still exists. Both keep their writable layer until <code>docker rm</code>. You'll meet 137 again in this lesson."
  },
  {
    id: "docker/2/q3",
    stem: "Which of these executes a command while the image is being built?",
    options: ["<code>CMD [\"java\", \"App\"]</code>", "<code>RUN javac App.java</code>", "<code>docker run -p 8080:8080</code>", "<code>docker exec NAME javac</code>"],
    answer: 1,
    why: "RUN executes during <code>docker build</code> and saves the result as a layer. CMD only records a default for later; the other two act on containers, not builds. <a href=\"https://docs.docker.com/reference/dockerfile/#cmd\">Dockerfile reference: CMD</a>"
  },
  {
    id: "docker/2/q4",
    stem: "A teammate adds <code>RUN java App</code> as the last line of the Dockerfile. What happens on <code>docker build</code>?",
    options: ["The build hangs while the server runs", "The server starts whenever a container starts", "Docker skips it because CMD is missing", "The build fails because ports are closed"],
    answer: 0,
    why: "RUN waits for its command to finish. A server never finishes, so the build never completes. Starting the service belongs in CMD."
  },
  {
    id: "docker/2/q5",
    stem: "The Dockerfile has <code>EXPOSE 8080</code>. You run <code>docker run -d dk-hello:0.1</code>, and <code>curl localhost:8080</code> on your Mac fails. Why?",
    options: ["The JVM is still starting up", "EXPOSE works only with a HEALTHCHECK", "Port 8080 is reserved by Docker", "EXPOSE only documents; -p actually publishes"],
    answer: 3,
    why: "\"The EXPOSE instruction doesn't actually publish the port.\" You need <code>-p 8080:8080</code>. <a href=\"https://docs.docker.com/reference/dockerfile/#expose\">Dockerfile reference: EXPOSE</a>"
  },
  {
    id: "docker/2/q6",
    stem: "With <code>CMD java App</code>, <code>docker stop</code> takes 10 seconds and the container shows <code>Exited (137)</code>. Why?",
    options: ["The JVM always needs ten seconds", "Docker waits longer for shell commands", "sh is PID 1, ignoring SIGTERM", "Port 8080 stays open after stop"],
    answer: 2,
    why: "Shell form runs <code>/bin/sh -c \"java App\"</code>. The shell is PID 1, doesn't pass SIGTERM on, and is killed after the grace period: 137 = 128 + 9 (SIGKILL). <a href=\"https://docs.docker.com/reference/dockerfile/#shell-and-exec-form\">Shell and exec form</a>"
  },
  {
    id: "docker/2/q7",
    stem: "From the folder <em>above</em> <code>docker-lab</code>, you run <code>docker build -t dk-hello:0.1 -f docker-lab/Dockerfile .</code>. Which instruction fails?",
    options: ["FROM can't find the base image", "COPY can't find App.java here", "RUN can't find the javac compiler", "CMD can't find the App class"],
    answer: 1,
    why: "The final <code>.</code> makes the parent folder the build context, and COPY paths are relative to the context. <code>App.java</code> sits at <code>docker-lab/App.java</code> there. <a href=\"https://docs.docker.com/build/concepts/context/\">Build context</a>"
  },
  {
    id: "docker/2/q8",
    stem: "Kubernetes stops a Pod with TERM to process 1, then KILL after a 30-second default grace period. Your image uses <code>CMD java App</code>. What happens on every rollout?",
    options: ["Java shuts down cleanly in seconds", "Kubernetes converts the CMD to exec", "The Pod never stops at all", "Each Pod waits 30s, then dies"],
    answer: 3,
    why: "Same as your experiment, but with Kubernetes' 30-second default: the shell ignores TERM, so each Pod hangs for the full grace period and is then killed mid-request. <a href=\"https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination\">Pod termination</a>"
  }
];
