#!/bin/bash
# This script will properly add your SSH key to the server

echo "This script will add your SSH key to the server"
echo "Run this from your VS Code terminal when connected to the server"
echo ""
echo "Commands to run:"
echo "================"
echo ""
echo "# 1. Create proper SSH directory and files"
echo "mkdir -p ~/.ssh"
echo "chmod 700 ~/.ssh"
echo "touch ~/.ssh/authorized_keys"
echo "chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "# 2. Add your key (this is all ONE line - copy it completely)"
echo 'echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC4xPsiq7pti4+XtrQP0pUMVv/c3RCjbSdGUZ8Vwmtk9Jjm++hJ8fMoozSiK2lBkEbUtlKhUso3OVoDS8d/KP+804bhy9/4HlZt6odAqTeBPBZoU/vpm5In+JMO5lr4FDakO8T+iDEwyoXlpLyjwgTviO38GGW3gNvL+E4blE3aKKyDqoBa00ekk25oAF1y2YGXkLO7aOkrjZBOrc9T6mPGMMd3rTZLZy+SUobO5YDZhiBytie/tjJwQlclC7t15yBeY++RXM/fNQkNc5RDogItXwcE8RjPMNFKLFSyEWq0V69zIfbfp9LFUPUjtaCCgByD+xnA//b+2V7GLQOZTbSKwJnVVqNgbDFvwxfV5nw/fXklt8uTk3wLIGA18J7GIDK94bq8OgLsWeMXE7buzkgtbFUeef/ae8nkyQIL3WHh4i4lpAVucE6oXvHv/dM0/zU5qq6fX+WGljnKOFzQxhJdSpvWRt4cB63f4o2/ohIB5EiMVCB0iNSZOgqgFyqQz3Ir0qYu2q66LjAVi8kwjRTDQQQCwE/sAAhX+aNk80hrh5NaX7vJ8Yv4baCMUD1swUpqvy1yFMn9zezTnDGzDk+HIkcR2MAMIAcOVyRz6/V34lxVbvuiXvCFKHjZzK/qUbvzOEIKOhz3MsGxHCJMmlSjEWYpuJbw1HXA621oYxhH+w== adamstack@stackmap-cpanel" > ~/.ssh/authorized_keys'
echo ""
echo "# 3. Verify the key was added correctly"
echo "wc -l ~/.ssh/authorized_keys  # Should show: 1"
echo "ssh-keygen -l -f ~/.ssh/authorized_keys  # Should show the key fingerprint"