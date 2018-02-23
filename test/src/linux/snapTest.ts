import { Platform } from "electron-builder"
import { app, assertPack } from "../helpers/packTester"

if (process.env.SNAP_TEST === "false") {
  fit("Skip snapTest suite — SNAP_TEST is set to false", () => {
    console.warn("[SKIP] Skip snapTest suite — SNAP_TEST is set to false")
  })
}

const snapTarget = Platform.LINUX.createTarget("snap")

test.ifAll.ifDevOrLinuxCi("snap", app({
  targets: snapTarget,
  config: {
    extraMetadata: {
      name: "sep",
    },
    productName: "Sep",
  },
}))

// custom packages to test not-prepacked snap build
// very slow
test.ifAll("snap full", app({
  targets: snapTarget,
  config: {
    extraMetadata: {
      name: "se-wo-template",
    },
    productName: "Snap Electron App (full build)",
    snap: {
      useTemplateApp: false,
    },
  },
}))

test.ifAll.ifDevOrLinuxCi("default stagePackages", async () => {
  for (const p of [["default"], ["default", "custom"], ["custom", "default"], ["foo1", "default", "foo2"]]) {
    await assertPack("test-app-one", {
      targets: Platform.LINUX.createTarget("snap"),
      config: {
        extraMetadata: {
          name: "sep",
        },
        productName: "Sep",
        snap: {
          stagePackages: p,
          plugs: p,
          confinement: "classic",
          // otherwise "parts" will be removed
          useTemplateApp: false,
        }
      },
      effectiveOptionComputed: async ({snap}) => {
        delete snap.parts.app.source
        expect(snap).toMatchSnapshot()
        return true
      },
    })
  }
})

test.ifAll.ifDevOrLinuxCi("buildPackages", async () => {
  await assertPack("test-app-one", {
    targets: Platform.LINUX.createTarget("snap"),
    config: {
      extraMetadata: {
        name: "sep",
      },
      productName: "Sep",
      snap: {
        buildPackages: ["foo1", "default", "foo2"],
        // otherwise "parts" will be removed
        useTemplateApp: false,
      }
    },
    effectiveOptionComputed: async ({snap}) => {
      delete snap.parts.app.source
      expect(snap).toMatchSnapshot()
      return true
    },
  })
})

test.ifDevOrLinuxCi("plugs option", async () => {
  for (const p of [
    [
      {
        "browser-sandbox": {
          interface: "browser-support",
          "allow-sandbox": true
        },
      },
      "another-simple-plug-name",
    ],
    {
      "browser-sandbox": {
        interface: "browser-support",
        "allow-sandbox": true
      },
      "another-simple-plug-name": null,
    },
  ]) {
    await assertPack("test-app-one", {
      targets: Platform.LINUX.createTarget("snap"),
      config: {
        snap: {
          plugs: p,
          // otherwise "parts" will be removed
          useTemplateApp: false,
        }
      },
      effectiveOptionComputed: async ({snap}) => {
        delete snap.parts.app.source
        expect(snap).toMatchSnapshot()
        return true
      },
    })
  }
})

test.ifDevOrLinuxCi("custom env", app({
  targets: Platform.LINUX.createTarget("snap"),
  config: {
    extraMetadata: {
      name: "sep",
    },
    productName: "Sep",
    snap: {
      environment: {
        FOO: "bar",
      },
    }
  },
  effectiveOptionComputed: async ({snap}) => {
    expect(snap).toMatchSnapshot()
    return true
  },
}))
