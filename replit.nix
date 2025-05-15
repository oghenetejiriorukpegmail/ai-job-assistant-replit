{ pkgs }: {
  deps = [
    pkgs.nodejs # Use the generic Node.js package
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.nodePackages.jest
  ];
}
