window.QUIZ = [
  {
    id: "docker/1/q1",
    stem: "You run <code>docker run alpine:3.20 echo hi</code>, then <code>docker ps</code>. The list is empty. Why?",
    options: ["The image never finished downloading locally", "Docker removed the container right after", "Its main process ended after echo", "Docker ps only lists named containers"],
    answer: 2,
    why: "A container lives as long as its main process. <code>echo</code> finishes at once, so the container moves to Exited. It still exists: <code>docker ps -a</code> shows it. It would only be removed with <code>--rm</code>. <a href=\"https://docs.docker.com/reference/cli/docker/container/run/\">docker run</a>"
  },
  {
    id: "docker/1/q2",
    stem: "Inside a running container <code>api</code>, your app creates <code>/tmp/cache.db</code>. You run <code>docker stop api</code>, then <code>docker start api</code>. Is the file there?",
    options: ["Yes, stopping keeps the writable layer", "No, stopping discards the writable layer", "Yes, the image now contains it", "No, start recreates it from image"],
    answer: 0,
    why: "Stop and start reuse the same container, \"with all its previous changes intact.\" The image is never modified. Only removing the container deletes its writable layer. <a href=\"https://docs.docker.com/reference/cli/docker/container/run/\">docker run</a>"
  },
  {
    id: "docker/1/q3",
    stem: "Containers <code>web-1</code> and <code>web-2</code> both run from <code>nginx:alpine</code>. In <code>web-1</code> you delete <code>index.html</code>. What does <code>web-2</code> serve?",
    options: ["Nothing, the file vanished for both", "Nothing, the shared image changed too", "Original page, since deletes get refused", "Original page, its layer is separate"],
    answer: 3,
    why: "The delete is allowed, but it is recorded only in <code>web-1</code>'s writable layer. The shared image layers are read-only, so <code>web-2</code> still sees the file. <a href=\"https://docs.docker.com/engine/storage/drivers/\">Storage drivers</a>"
  },
  {
    id: "docker/1/q4",
    stem: "Which command lists exactly which files a container added, changed or deleted compared with its image?",
    options: ["<code>docker logs NAME</code>", "<code>docker diff NAME</code>", "<code>docker history NAME</code>", "<code>docker inspect NAME</code>"],
    answer: 1,
    why: "<code>docker diff</code> lists changes in the container's filesystem since it was created, marked A (added), C (changed) and D (deleted). <code>history</code> describes an image's layers, not a container. <a href=\"https://docs.docker.com/reference/cli/docker/container/diff/\">docker diff</a>"
  },
  {
    id: "docker/1/q5",
    stem: "<code>docker rmi alpine:3.20</code> fails with \"container … is using its referenced image\", but <code>docker ps</code> shows nothing running. What is going on?",
    options: ["The image is still downloading somewhere", "Docker Desktop needs a restart first", "A stopped container still uses it", "Another tag shares the same layers"],
    answer: 2,
    why: "An exited container still exists, and its writable layer sits on top of that image, so the image can't be removed. <code>docker ps -a</code> shows it. Remove the container first."
  },
  {
    id: "docker/1/q6",
    stem: "On Kubernetes, your app writes uploads to <code>/data</code> inside its container, with no volume. The container crashes and kubelet restarts it. What happens to the uploads?",
    options: ["They survive, like stop then start", "They are gone; restart starts clean", "They survive, saved to the registry", "They are gone only after reboot"],
    answer: 1,
    why: "\"After a crash, kubelet restarts the container with a clean state.\" That is stricter than Docker's stop then start. Data that must survive belongs in a volume or an outside service. <a href=\"https://kubernetes.io/docs/concepts/storage/volumes/\">Kubernetes: Volumes</a>"
  },
  {
    id: "docker/1/q7",
    stem: "A config file inside a running production container has a typo. What is the container-native fix?",
    options: ["Exec in and edit the file", "Stop it, edit, then start again", "Commit the container as an image", "Build a new image, then recreate"],
    answer: 3,
    why: "Containers are meant to be immutable: \"build a new image that includes the change, then recreate the container.\" Edits made with exec are lost when the container is replaced, and nobody can reproduce them. <a href=\"https://kubernetes.io/docs/concepts/containers/\">Kubernetes: Containers</a>"
  }
];
