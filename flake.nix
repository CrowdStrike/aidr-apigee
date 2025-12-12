{
  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.simpleFlake {
      inherit self nixpkgs;
      name = "cs-aidr-apigee";
      shell = {pkgs ? import <nixpkgs>}:
        pkgs.mkShellNoCC {
          packages = with pkgs; [
            cosign
            google-cloud-sdk
            pnpm
            unzip
            zip
          ];

          env = {};

          shellHook = ''
            echo "Installing apigeecli"
            curl -s https://raw.githubusercontent.com/apigee/apigeecli/main/downloadLatest.sh | bash
            export PATH=$PATH:$HOME/.apigeecli/bin
          '';
        };
    };
}
