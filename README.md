# IPSM Dashboard
The repository contains the source code for building  a `Docker` image for the `IPSM Dashboard`.
## Building the image

To create a `Docker` image for the `Dashboard` invoke the following command:

```bash
docker build -t interiot/ipsm-dashboard:<version> .
```
where `<version>` should be replaced by the actual `Dashboard` version number, taken from the `package.json`.

In case you have `NPM` (Node Package Manager) installed on the machine it can also be used to build, tag (clean, and push) `Docker` image(s):

```bash
npm run docker:build
```

The above commands assume that `Docker` is available on the develpment machine, and that the user has sufficient provileges to use it (without `sudo`).

The resulting image will be available from the local `Docker` registry under the name `interiot/ipsm-dashboard:n.n.n`, where `n.n.n` represents the current `IPSM Dashboard` version. The list of locally available images should be similar to:

```bash
user@devel-machine:~$ docker image ls
REPOSITORY                      TAG                 IMAGE ID            CREATED             SIZE
interiot/ipsm-dashboard         1.1.6               2043723c555a        1 minute ago        826MB
```

To tag the created image as the `latest` version use the command:
```bash
npm run docker:tag
```

The image is further used for the `IPSM Dashboard` [dockerized deployment](https://github.com/INTER-IoT/ipsm-dashboard-docker.git).
