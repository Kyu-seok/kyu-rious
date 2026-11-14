window.QUIZ = [
  {
    id: "docker/3/q1",
    section: "warmup",
    stem: "Which of these lines runs every time a container starts, not once at build time?",
    options: ["<code>RUN mvn -B package</code>", "<code>COPY src ./src</code>", "<code>CMD [\"java\", \"-jar\", \"app.jar\"]</code>", "<code>WORKDIR /app</code>"],
    answer: 2,
    why: "CMD records the default command for later; it runs when a container starts. RUN, COPY and WORKDIR act once, during <code>docker build</code>. <a href=\"https://docs.docker.com/reference/dockerfile/#cmd\">Dockerfile reference: CMD</a>"
  },
  {
    id: "docker/3/q2",
    section: "warmup",
    stem: "<code>docker rmi dk-hello:0.1</code> is refused, but <code>docker ps</code> shows nothing running. Why?",
    options: ["An exited container still uses that image", "Docker locks images while the engine runs", "Images can't be removed once they're tagged", "The base image must be removed first"],
    answer: 0,
    why: "<code>docker ps</code> hides exited containers; <code>docker ps -a</code> shows them. An exited container still exists, still uses its image, and blocks <code>rmi</code> until it's removed."
  },
  {
    id: "docker/3/q3",
    stem: "A Dockerfile has <code>COPY . .</code> and then <code>RUN mvn -B package</code>. You change one line of <code>App.java</code>. Why does Maven download everything again?",
    options: ["Maven empties its download folder each build", "COPY changed, so every later step reruns", "Docker never caches steps that use networks", "FROM pulls a fresh Maven image again"],
    answer: 1,
    why: "\"If a layer changes, all other layers that come after it are also affected.\" The downloads happen inside the RUN step, which comes after the changed COPY. <a href=\"https://docs.docker.com/build/cache/\">Docker build cache</a>"
  },
  {
    id: "docker/3/q4",
    stem: "In the multi-stage Dockerfile, you add a dependency to <code>pom.xml</code>. Which is the <em>first</em> step to rerun?",
    options: ["<code>RUN mvn -B dependency:go-offline</code>", "<code>COPY src ./src</code>", "<code>FROM eclipse-temurin:21-jre</code>", "<code>COPY pom.xml .</code>"],
    answer: 3,
    why: "COPY's input is the file's contents, so <code>COPY pom.xml .</code> itself is the first step that misses the cache. Everything after it in the build stage reruns too."
  },
  {
    id: "docker/3/q5",
    stem: "What does the image built from a two-stage Dockerfile contain?",
    options: ["The last stage, plus what it copied", "Both stages' layers, stacked in file order", "Only the build stage, where Maven ran", "Both stages, squashed into a single layer"],
    answer: 0,
    why: "The image is the final stage. Earlier stages only contribute what you take with <code>COPY --from</code>, which leaves \"behind everything you don't want in the final image.\" <a href=\"https://docs.docker.com/build/building/multi-stage/\">Multi-stage builds</a>"
  },
  {
    id: "docker/3/q6",
    stem: "In a running <code>dk-hello:0.2</code> container, you run <code>docker exec dk-hello javac -version</code>. What happens?",
    options: ["Prints 21, copied over from the build stage", "Prints 21, because every JRE ships javac too", "Fails, because a JRE image has no javac", "Fails, because exec only works on stopped containers"],
    answer: 2,
    why: "The runtime stage starts from <code>eclipse-temurin:21-jre</code>, which can run Java but not compile it, and you copied only the jar into it. The JDK stayed behind in the build stage."
  },
  {
    id: "docker/3/q7",
    stem: "You ran <code>mvn package</code> on your Mac, so <code>target/</code> is full. What changes when you add <code>target/</code> to <code>.dockerignore</code>?",
    options: ["The image's own target folder gets deleted", "Maven skips compiling inside the build stage", "Docker cleans target/ on your Mac first", "Those files aren't sent to the builder"],
    answer: 3,
    why: "<code>.dockerignore</code> excludes files from the build context, so the builder never receives them. Your folder on the Mac and Maven's work in the image are unaffected. <a href=\"https://docs.docker.com/build/concepts/context/\">Build context</a>"
  },
  {
    id: "docker/3/q8",
    stem: "A cluster adds a new node that already has the <code>eclipse-temurin:21-jre</code> layers. What must that node pull to start your Pod?",
    options: ["The full image, including the Maven stage", "Only missing layers, such as your jar", "Nothing; nodes build images from the Dockerfile", "Your source code, to compile it there"],
    answer: 1,
    why: "Images are shared stacks of layers (Lesson 1), so a node only fetches the layers it lacks. Kubernetes never builds, and the Maven stage was never part of the image. <a href=\"https://kubernetes.io/docs/concepts/containers/images/\">Kubernetes: Images</a>"
  }
];
